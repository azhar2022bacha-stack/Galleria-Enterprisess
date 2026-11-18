import { NextResponse } from 'next/server';
import {
  createAdminAccount,
  getAdminAccounts,
  removeAdminAccount,
  setAdminStatus,
  toPublicAdminAccount,
  updateAdminPassword,
  verifyAdminPassword,
} from '@/lib/adminAccountsServer';
import { getRequestAdmin } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await getRequestAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });
    if (!admin.isRoot) return NextResponse.json({ success: false, error: 'Only admin·root can manage administrator accounts.' }, { status: 403 });
    const accounts = await getAdminAccounts();
    return NextResponse.json({ success: true, accounts: accounts.map(toPublicAdminAccount) });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to load admin accounts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getRequestAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });
    if (!admin.isRoot) return NextResponse.json({ success: false, error: 'Only admin·root can add administrators.' }, { status: 403 });

    const body = await request.json();
    if (String(body.password || '') !== String(body.confirmPassword || '')) {
      return NextResponse.json({ success: false, error: 'Password and confirmation do not match.' }, { status: 400 });
    }
    const account = await createAdminAccount(String(body.email || ''), String(body.password || ''));
    return NextResponse.json({ success: true, account: toPublicAdminAccount(account) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to create the admin account.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getRequestAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });
    const body = await request.json();

    if (body.action === 'change-password') {
      const currentPassword = String(body.currentPassword || '');
      const newPassword = String(body.newPassword || '');
      if (!currentPassword || !newPassword) return NextResponse.json({ success: false, error: 'Enter your current password and a new password.' }, { status: 400 });
      if (newPassword !== String(body.confirmPassword || '')) return NextResponse.json({ success: false, error: 'New password and confirmation do not match.' }, { status: 400 });
      if (currentPassword === newPassword) return NextResponse.json({ success: false, error: 'Choose a new password different from your current password.' }, { status: 400 });
      if (!(await verifyAdminPassword(admin, currentPassword))) return NextResponse.json({ success: false, error: 'Your current password is incorrect.' }, { status: 400 });
      const updated = await updateAdminPassword(admin.id, newPassword);
      if (!updated) return NextResponse.json({ success: false, error: 'Could not update your password. Please try again.' }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Password updated successfully.' });
    }

    if (!admin.isRoot) return NextResponse.json({ success: false, error: 'Only admin·root can manage administrator accounts.' }, { status: 403 });
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ success: false, error: 'Choose an admin account first.' }, { status: 400 });
    if (id === admin.id) return NextResponse.json({ success: false, error: 'You cannot suspend your own account.' }, { status: 400 });
    const status = body.status === 'Suspended' ? 'Suspended' : body.status === 'Active' ? 'Active' : null;
    if (!status) return NextResponse.json({ success: false, error: 'Choose a valid account status.' }, { status: 400 });
    const updated = await setAdminStatus(id, status);
    if (!updated) return NextResponse.json({ success: false, error: 'The protected main account cannot be changed.' }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to update the admin account.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await getRequestAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });
    if (!admin.isRoot) return NextResponse.json({ success: false, error: 'Only admin·root can remove administrators.' }, { status: 403 });
    const body = await request.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ success: false, error: 'Choose an admin account first.' }, { status: 400 });
    if (id === admin.id) return NextResponse.json({ success: false, error: 'You cannot remove your own account.' }, { status: 400 });
    const removed = await removeAdminAccount(id);
    if (!removed) return NextResponse.json({ success: false, error: 'The protected main account cannot be removed.' }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to remove the admin account.' }, { status: 400 });
  }
}
