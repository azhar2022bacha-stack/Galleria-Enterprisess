import { NextResponse } from 'next/server';
import { getSellerByEmailServer } from '@/lib/inviteCodesServer';
import { validatePasswordComplexity, verifyPasswordWithSalt, verifyCombinedPasswordHash } from '@/lib/passwordValidation';
import { finishRecovery, pendingEmail, recoveredAccount, recoveryOwner, RecoveryError, requestNewCredentials } from '@/lib/sellerRecoveryServer';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({error:'Invalid recovery link.'},{status:400});
  try {
    const verifying = body.action === 'verify';
    const account = recoveryOwner(token, verifying);
    const seller = await getSellerByEmailServer(account);
    if (!seller) throw new RecoveryError('This seller account is unavailable.');
    const email = verifying ? pendingEmail(account) : String(body.email || '').trim().toLowerCase();
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new RecoveryError('Enter a valid email address.');
    if (email !== account && (await getSellerByEmailServer(email) || (recoveredAccount(email) && recoveredAccount(email) !== account)))
      throw new RecoveryError('That email is already in use.');
    if (verifying) finishRecovery(token);
    else {
      const password = body.password;
      if (typeof password !== 'string' || password.length > 256) throw new RecoveryError('Enter a valid new password.');
      const validation = validatePasswordComplexity(password);
      if (!validation.isValid) throw new RecoveryError(validation.errors[0]);
      if (seller.transactionHash && (await verifyCombinedPasswordHash(password,seller.transactionHash) || (seller.salt && await verifyPasswordWithSalt(password,seller.transactionHash,seller.salt))))
        throw new RecoveryError('Choose a password different from your transaction password.');
      await requestNewCredentials(token,email,password);
    }
    return NextResponse.json({success:true}, {headers:{'Cache-Control':'no-store'}});
  } catch (err) { return NextResponse.json({error:err instanceof RecoveryError ? err.message : 'Recovery could not be completed. Try again.'},{status:400}); }
}
