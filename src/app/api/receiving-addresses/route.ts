import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import {
  isCryptoReceivingNetworkId,
  validateCryptoReceivingAddress,
} from '@/lib/cryptoReceivingAddresses';
import {
  getSellerCryptoReceivingAddresses,
  readCryptoReceivingAddressConfig,
  writeCryptoReceivingAddressConfig,
} from '@/lib/cryptoReceivingAddressesServer';
import { getRequestSellerEmail } from '@/lib/sellerSession';

export const dynamic = 'force-dynamic';

function getSellerSessionEmail(request: Request): string {
  return getRequestSellerEmail(request);
}

export async function GET(request: Request) {
  const admin = await getRequestAdmin(request);
  const sellerEmail = getSellerSessionEmail(request);
  const scope = new URL(request.url).searchParams.get('scope');
  if (scope === 'admin' && !admin) {
    return NextResponse.json({ success: false, error: 'Please sign in to the admin panel.' }, { status: 401 });
  }
  if (scope === 'seller' && !sellerEmail) {
    return NextResponse.json({ success: false, error: 'Please sign in to the seller account.' }, { status: 401 });
  }
  if (!admin && !sellerEmail) {
    return NextResponse.json({ success: false, error: 'Please sign in to view receiving addresses.' }, { status: 401 });
  }

  const config = readCryptoReceivingAddressConfig();
  if (admin && scope !== 'seller') {
    return NextResponse.json({ success: true, addresses: config.addresses, sellerOverrides: config.sellerOverrides });
  }
  return NextResponse.json({ success: true, addresses: getSellerCryptoReceivingAddresses(config, sellerEmail) });
}

export async function POST(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Please sign in to the admin panel.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const networkId = body?.networkId;
    const target = body?.target === 'all' ? 'all' : 'seller';
    const sellerEmail = String(body?.sellerEmail || '').trim().toLowerCase();
    const address = String(body?.address || '').trim();
    if (!isCryptoReceivingNetworkId(networkId)) {
      return NextResponse.json({ success: false, error: 'Choose a supported crypto network.' }, { status: 400 });
    }
    if (target === 'seller' && !sellerEmail) {
      return NextResponse.json({ success: false, error: 'Choose a seller or select all sellers.' }, { status: 400 });
    }
    if (address.length > 160) {
      return NextResponse.json({ success: false, error: 'The receiving address is too long.' }, { status: 400 });
    }

    const config = readCryptoReceivingAddressConfig();
    if (address) {
      const validationError = validateCryptoReceivingAddress(networkId, address);
      if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    } else if (target === 'all') {
      return NextResponse.json({ success: false, error: 'Enter an address before applying it to all sellers.' }, { status: 400 });
    }

    if (target === 'all') {
      config.addresses[networkId] = address;
      for (const overrides of Object.values(config.sellerOverrides)) delete overrides[networkId];
      for (const email of Object.keys(config.sellerOverrides)) {
        if (!Object.keys(config.sellerOverrides[email]).length) delete config.sellerOverrides[email];
      }
    } else if (address) {
      config.sellerOverrides[sellerEmail] = { ...(config.sellerOverrides[sellerEmail] || {}), [networkId]: address };
    } else {
      delete config.sellerOverrides[sellerEmail]?.[networkId];
      if (config.sellerOverrides[sellerEmail] && !Object.keys(config.sellerOverrides[sellerEmail]).length) {
        delete config.sellerOverrides[sellerEmail];
      }
    }

    writeCryptoReceivingAddressConfig(config);
    return NextResponse.json({
      success: true,
      message: 'Receiving address saved.',
      addresses: config.addresses,
      sellerOverrides: config.sellerOverrides,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unable to save the receiving address.',
    }, { status: 400 });
  }
}
