import { NextResponse } from 'next/server';
import { authenticateSellerServer, updateSellerLoginPasswordServer } from '@/lib/inviteCodesServer';
import { validatePasswordComplexity } from '@/lib/passwordValidation';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export async function POST(request: Request) {
  try {
    const email = getRequestSellerEmail(request);
    if (!email) return NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });

    const body = await request.json();
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Enter your current password and a new password.' }, { status: 400 });
    }

    const complexity = validatePasswordComplexity(newPassword);
    if (!complexity.isValid) {
      return NextResponse.json({ success: false, error: complexity.errors[0] }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ success: false, error: 'Choose a new password different from your current password.' }, { status: 400 });
    }

    const auth = await authenticateSellerServer(email, currentPassword, true);
    if (!auth.success) {
      return NextResponse.json({ success: false, error: 'Your current password is incorrect.' }, { status: 400 });
    }

    const updated = await updateSellerLoginPasswordServer(email, newPassword);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Could not update your password. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Could not update your password.' }, { status: 500 });
  }
}
