import { recoveredAccount } from '@/lib/sellerRecoveryServer';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { setSellerSessionCookie } from '@/lib/sellerSession';
import {
  validateRegistrationPasswords,
  hashPasswordWithSalt,
} from '@/lib/passwordValidation';
import {
  validateCodeServer,
  consumeCodeServer,
  recordSellerAccount,
  getSellerByEmailServer,
} from '@/lib/inviteCodesServer';
import { createSellerNotificationServer } from '@/lib/sellerNotificationsServer';
import {
  EXACT_INVALID_INVITE_ERROR,
  EXACT_EXHAUSTED_INVITE_ERROR,
} from '@/lib/inviteCodes';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const shopName = typeof body?.shopName === 'string' ? body.shopName.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';
    const transactionPin = typeof body?.transactionPin === 'string' ? body.transactionPin : '';
    const repeatTransactionPin = typeof body?.repeatTransactionPin === 'string' ? body.repeatTransactionPin : '';
    const invitationCode = typeof body?.invitationCode === 'string' ? body.invitationCode.trim().toUpperCase() : '';
    const agreedToTerms = body?.agreedToTerms === true;

    if (!fullName || !email || !shopName) {
      return NextResponse.json(
        { success: false, error: 'Full Name, Email Address, and Shop Name are required.' },
        { status: 400 }
      );
    }

    if (fullName.length > 255 || email.length > 255 || shopName.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Full Name, Email Address, and Shop Name must be 255 characters or fewer.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid email address.' },
        { status: 400 }
      );
    }

    if ([password, confirmPassword, transactionPin, repeatTransactionPin].some((value) => value.length > 256)) {
      return NextResponse.json(
        { success: false, error: 'Passwords must be 256 characters or fewer.' },
        { status: 400 }
      );
    }

    if (!agreedToTerms) {
      return NextResponse.json(
        {
          success: false,
          error: "You must agree to Reapex's Privacy Policy and Terms & Conditions to proceed.",
        },
        { status: 400 }
      );
    }

    // PRD: Invitation Code is strictly mandatory during user registration
    if (!invitationCode) {
      return NextResponse.json(
        {
          success: false,
          error: EXACT_INVALID_INVITE_ERROR,
        },
        { status: 400 }
      );
    }

    // Verify invitation code validity and available usage limit on persistent server (PostgreSQL-backed)
    const inviteCheck = await validateCodeServer(invitationCode);
    if (!inviteCheck.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: inviteCheck.error || EXACT_INVALID_INVITE_ERROR,
        },
        { status: 400 }
      );
    }

    // Backend validation of password security & difference
    const validation = validateRegistrationPasswords({
      password: password || '',
      confirmPassword: confirmPassword || '',
      transactionPin: transactionPin || '',
      repeatTransactionPin: repeatTransactionPin || '',
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errors.separation || 'Password validation failed.',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Do not let a second registration replace an existing seller's credentials.
    // Check only after validating the invitation so this does not expose account status to arbitrary visitors.
    if (recoveredAccount(email) || await getSellerByEmailServer(email)) {
      return NextResponse.json(
        { success: false, error: 'A seller account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Hash both passwords before consuming the invitation so a hashing failure does not spend an invite.
    const salt = `${email}_${Date.now()}_${randomBytes(16).toString('hex')}`;
    const [hashedLoginPassword, hashedTransactionPassword] = await Promise.all([
      hashPasswordWithSalt(password, salt),
      hashPasswordWithSalt(transactionPin, salt),
    ]);

    // Consume one invitation use and record the registration details.
    const consumeResult = await consumeCodeServer(invitationCode, {
      fullName,
      email,
      shopName,
    });
    if (!consumeResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: consumeResult.error || EXACT_INVALID_INVITE_ERROR,
        },
        { status: 400 }
      );
    }

    // Permanently record seller account in PostgreSQL database and persistent storage
    await recordSellerAccount({
      fullName,
      email,
      shopName,
      loginHash: hashedLoginPassword,
      transactionHash: hashedTransactionPassword,
      salt,
      inviteCode: String(invitationCode).trim().toUpperCase(),
      status: 'review',
      idStatus: 'No ID uploaded',
    });

    try {
      createSellerNotificationServer({
        sellerEmail: email,
        category: 'Account & Verification',
        title: 'Seller account review started',
        message: [
          { text: 'Your seller registration is complete. ' },
          { text: 'Your account is under review', emphasis: 'blue' },
          { text: '. We’ll post the decision and any requests for more information here.' },
        ],
        tone: 'info',
        href: '/seller/dashboard?tab=notifications',
        dedupeKey: `seller-registration:${email.trim().toLowerCase()}`,
      });
    } catch (notificationError) {
      console.error('Unable to create seller registration notification:', notificationError);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Shop registered successfully! Welcome to the Wholesale Seller Portal.',
        seller: {
          fullName,
          email,
          shopName,
          status: 'review',
          idStatus: 'No ID uploaded',
          isApproved: false,
          invitationCode: String(invitationCode).trim().toUpperCase(),
          remainingInviteUses: consumeResult.remainingUses,
          hasSecureTransactionPassword: true,
        },
      },
      { status: 200 }
    );

    setSellerSessionCookie(response, email);

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
