import { NextRequest, NextResponse } from 'next/server';
import {
  getAllKycSubmissionsServer,
  getKycSubmissionByEmailServer,
  submitKycServer,
  updateKycStatusServer,
} from '@/lib/kycServer';
import { getAllSellersServer, updateSellerStatusServer } from '@/lib/inviteCodesServer';
import { createSellerNotificationServer } from '@/lib/sellerNotificationsServer';
import { getRequestAdmin } from '@/lib/adminSession';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export const dynamic = 'force-dynamic';

/**
 * GET /api/kyc
 * Query all submissions or filter by ?email=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const admin = await getRequestAdmin(req);
    if (!email && !admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    if (email && !admin) {
      const sessionEmail = getRequestSellerEmail(req);
      if (!sessionEmail) return NextResponse.json({ success: false, error: 'Seller sign-in is required.' }, { status: 401 });
      if (sessionEmail !== email.trim().toLowerCase()) return NextResponse.json({ success: false, error: 'You can only view your own verification record.' }, { status: 403 });
    }

    if (email) {
      const submission = await getKycSubmissionByEmailServer(email);
      return NextResponse.json({
        success: true,
        submission,
      });
    }

    const submissions = await getAllKycSubmissionsServer();
    const sellers = await getAllSellersServer();
    const registrationReviews = sellers
      .filter((seller) => {
        const email = String(seller.email || '').trim().toLowerCase();
        return email && seller.status === 'review';
      })
      .map((seller) => ({
        id: `seller-registration:${encodeURIComponent(String(seller.email).trim().toLowerCase())}`,
        sellerEmail: String(seller.email).trim().toLowerCase(),
        sellerName: seller.fullName || seller.subtitle || seller.name || 'Seller',
        shopName: seller.shopName || seller.name || 'New shop',
        docType: 'Shop registration',
        frontImage: '',
        status: 'pending' as const,
        submittedAt: seller.createdAt || new Date().toISOString(),
        source: 'seller-registration' as const,
        phone: seller.phone || '',
      }));
    const allItems = [...submissions, ...registrationReviews]
      .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
    return NextResponse.json({
      success: true,
      submissions: allItems,
      total: allItems.length,
      kycTotal: submissions.length,
      registrationTotal: registrationReviews.length,
    });
  } catch (err: any) {
    console.error('Error fetching KYC submissions:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kyc
 * Submit identity documents from User Panel
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sellerEmail, sellerName, shopName, docType, frontImage, backImage } = body;
    const sessionEmail = getRequestSellerEmail(req);
    if (!sessionEmail || sessionEmail !== String(sellerEmail || '').trim().toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Sign in to the matching seller account before submitting verification.' }, { status: 401 });
    }

    if (!sellerEmail || !sellerEmail.trim()) {
      return NextResponse.json(
        { success: false, error: 'User email is required for KYC submission.' },
        { status: 400 }
      );
    }

    if (!docType) {
      return NextResponse.json(
        { success: false, error: 'Document type is required.' },
        { status: 400 }
      );
    }

    if (!frontImage) {
      return NextResponse.json(
        { success: false, error: 'Please upload the front image of your document.' },
        { status: 400 }
      );
    }

    const validTypes = [
      'National ID Card (NIC)',
      'Passport',
      'Driving Licence',
      'Residence Permit',
    ];

    const normalizedDocType = validTypes.includes(docType)
      ? docType
      : docType.toLowerCase().includes('passport')
      ? 'Passport'
      : docType.toLowerCase().includes('driving') || docType.toLowerCase().includes('driver')
      ? 'Driving Licence'
      : docType.toLowerCase().includes('residence') || docType.toLowerCase().includes('resident')
      ? 'Residence Permit'
      : 'National ID Card (NIC)';

    const submission = await submitKycServer({
      sellerEmail: sellerEmail.trim(),
      sellerName: (sellerName || sellerEmail.split('@')[0]).trim(),
      shopName: (shopName || sellerName || 'My Shop').trim(),
      docType: normalizedDocType as any,
      frontImage,
      backImage,
    });

    try {
      createSellerNotificationServer({
        sellerEmail: submission.sellerEmail,
        category: 'Account & Verification',
        title: 'Verification documents received',
        message: [
          { text: `We received your ${submission.docType} documents. ` },
          { text: 'Your verification is now under review.', emphasis: 'blue' },
          { text: ' We’ll update you here when the review is complete.' },
        ],
        tone: 'info',
        href: '/seller/dashboard?tab=verification',
        dedupeKey: `kyc-submitted:${submission.id}:${submission.submittedAt}`,
      });
    } catch (notificationError) {
      console.error('Unable to create KYC submission notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'KYC documents submitted successfully. Status is now pending verification.',
      submission,
    });
  } catch (err: any) {
    console.error('Error submitting KYC documents:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/kyc
 * Admin action: Approve or Reject KYC submission
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getRequestAdmin(req);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
    const body = await req.json();
    const { id, status, reason, reviewedBy } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Submission ID is required.' },
        { status: 400 }
      );
    }

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json(
        { success: false, error: 'Status must be approved or rejected.' },
        { status: 400 }
      );
    }

    const submissionId = String(id);
    if (submissionId.startsWith('seller-registration:')) {
      if (status !== 'approved') {
        return NextResponse.json(
          { success: false, error: 'New shop applications can be approved here; suspend or reject them from Seller Management.' },
          { status: 400 }
        );
      }
      let sellerEmail = '';
      try { sellerEmail = decodeURIComponent(submissionId.slice('seller-registration:'.length)).trim().toLowerCase(); }
      catch { sellerEmail = ''; }
      if (!sellerEmail) return NextResponse.json({ success: false, error: 'Seller email is invalid.' }, { status: 400 });

      const seller = (await getAllSellersServer()).find((item) => item.email.trim().toLowerCase() === sellerEmail);
      if (!seller || seller.status !== 'review') {
        return NextResponse.json({ success: false, error: 'This shop application is no longer pending.' }, { status: 404 });
      }
      await updateSellerStatusServer(sellerEmail, 'approved');
      const updatedSeller = (await getAllSellersServer()).find((item) => item.email.trim().toLowerCase() === sellerEmail);
      if (!updatedSeller || updatedSeller.status !== 'approved') {
        return NextResponse.json({ success: false, error: 'The shop application could not be saved.' }, { status: 503 });
      }

      try {
        createSellerNotificationServer({
          sellerEmail,
          category: 'Account & Verification',
          title: 'Your shop application is approved',
          message: [
            { text: `${updatedSeller.shopName} has been approved as a seller account. ` },
            { text: 'You can access your seller account', emphasis: 'blue' },
            { text: '. Complete identity verification separately if it is still pending.' },
          ],
          tone: 'success',
          href: '/seller/dashboard?tab=verification',
          dedupeKey: `seller-registration-approved:${sellerEmail}`,
        });
      } catch (notificationError) {
        console.error('Unable to create seller application approval notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        message: 'Shop application approved.',
        submission: {
          id: submissionId,
          sellerEmail,
          sellerName: updatedSeller.fullName || updatedSeller.subtitle || updatedSeller.name,
          shopName: updatedSeller.shopName || updatedSeller.name,
          docType: 'Shop registration',
          frontImage: '',
          status: 'approved',
          submittedAt: updatedSeller.createdAt || new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
          reviewedBy: admin.email,
          source: 'seller-registration',
          phone: updatedSeller.phone || '',
        },
      });
    }

    const previousSubmissions = await getAllKycSubmissionsServer();
    const previous = previousSubmissions.find((item) => item.id === String(id));
    const updated = await updateKycStatusServer(
      String(id),
      status,
      reason || '',
      admin.email
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'KYC submission not found.' },
        { status: 404 }
      );
    }

    if (previous?.status !== status) {
      try {
        const approved = status === 'approved';
        const reasonText = String(reason || updated.rejectionReason || '').trim();
        createSellerNotificationServer({
          sellerEmail: updated.sellerEmail,
          category: 'Account & Verification',
          title: approved ? 'Your identity verification is approved' : 'Action needed: KYC verification was not approved',
          message: approved
            ? [
                { text: 'Your identity documents have been verified. ' },
                { text: 'Your account is now verified', emphasis: 'blue' },
                { text: ' and eligible seller features are available.' },
              ]
            : [
                { text: 'We could not approve your identity documents. ' },
                { text: 'Reason: ', emphasis: 'red' },
                { text: reasonText || 'The documents could not be verified.', emphasis: 'red' },
                { text: ' Please upload clear, valid documents and submit them again.', emphasis: 'red' },
              ],
          tone: approved ? 'success' : 'rejection',
          href: '/seller/dashboard?tab=verification',
          dedupeKey: `kyc-decision:${updated.id}:${status}:${updated.reviewedAt || new Date().toISOString()}`,
        });
      } catch (notificationError) {
        console.error('Unable to create KYC decision notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `KYC submission marked as ${status}.`,
      submission: updated,
    });
  } catch (err: any) {
    console.error('Error updating KYC status:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
