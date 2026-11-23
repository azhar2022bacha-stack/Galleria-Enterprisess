import { NextResponse } from 'next/server';
import { authenticateSellerServer, getSellerByEmailServer } from '@/lib/inviteCodesServer';
import { validatePasswordComplexity, verifyPasswordWithSalt, verifyCombinedPasswordHash } from '@/lib/passwordValidation';
import { saveRecovery, recoveredAccount, recoveryOwner, RecoveryError } from '@/lib/sellerRecoveryServer';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({error:'Invalid recovery link.'},{status:400});
  try {
    const email = String(body.email || '').trim().toLowerCase();
    const account = recoveryOwner(token, email);
    const seller = await getSellerByEmailServer(account);
    if (!seller) throw new RecoveryError('This seller account is unavailable.');
    if (email !== account && (await getSellerByEmailServer(email) || (recoveredAccount(email) && recoveredAccount(email) !== account)))
      throw new RecoveryError('That email is already in use.');
    const password = body.password;
    if (typeof password !== 'string' || password.length > 256) throw new RecoveryError('Enter a valid new password.');
    const validation = validatePasswordComplexity(password);
    if (!validation.isValid) throw new RecoveryError(validation.errors[0]);
    if (seller.transactionHash && (await verifyCombinedPasswordHash(password,seller.transactionHash) || (seller.salt && await verifyPasswordWithSalt(password,seller.transactionHash,seller.salt))))
      throw new RecoveryError('Choose a password different from your transaction password.');
    if ((await authenticateSellerServer(account, password, true)).success) throw new RecoveryError("Choose a password different from your current password.");
    await saveRecovery(token, email, password);
    return NextResponse.json({success:true}, {headers:{'Cache-Control':'no-store'}});
  } catch (err) { return NextResponse.json({error:err instanceof RecoveryError ? err.message : 'Recovery could not be completed. Try again.'},{status:400}); }
}
