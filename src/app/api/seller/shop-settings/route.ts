import { NextResponse } from 'next/server';
import { getSellerByEmailServer, updateSellerShopNameServer } from '@/lib/inviteCodesServer';
import {
  getSellerShopSettingsServer,
  hasSellerShopSettingsServer,
  saveSellerShopSettingsServer,
} from '@/lib/sellerShopSettingsServer';
import type { StoredShopSettings } from '@/lib/sellerShopSettingsServer';
import { countShopDescriptionCharacters, MAX_SHOP_DESCRIPTION_CHARACTERS } from '@/lib/sellerShopDescription';
import { getRequestSellerEmail } from '@/lib/sellerSession';

const MAX_LOGO_BYTES = 8 * 1024 * 1024;

async function getAuthenticatedSeller(request: Request) {
  const email = getRequestSellerEmail(request);
  if (!email) return { email: '', seller: null };
  return { email, seller: await getSellerByEmailServer(email) };
}

export async function GET(request: Request) {
  try {
    const { email, seller } = await getAuthenticatedSeller(request);
    if (!email) return NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });
    if (!seller) return NextResponse.json({ success: false, error: 'Seller account was not found.' }, { status: 404 });

    const defaults: StoredShopSettings = {
      shopName: seller.shopName || 'Wholesale Shop',
      description: '',
    };
    const settings = getSellerShopSettingsServer(email, defaults);
    return NextResponse.json(
      { success: true, settings, hasSavedSettings: hasSellerShopSettingsServer(email) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Could not load shop settings.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { email, seller } = await getAuthenticatedSeller(request);
    if (!email) return NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });
    if (!seller) return NextResponse.json({ success: false, error: 'Seller account was not found.' }, { status: 404 });

    const body = await request.json();
    const shopName = typeof body.shopName === 'string' ? body.shopName.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl : '';

    if (!shopName || shopName.length > 80) {
      return NextResponse.json({ success: false, error: 'Shop name must be between 1 and 80 characters.' }, { status: 400 });
    }
    if (countShopDescriptionCharacters(description) > MAX_SHOP_DESCRIPTION_CHARACTERS) {
      return NextResponse.json({ success: false, error: `Description can be up to ${MAX_SHOP_DESCRIPTION_CHARACTERS} characters.` }, { status: 400 });
    }
    if (logoUrl) {
      const match = logoUrl.match(/^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
      if (!match || Buffer.from(match[1], 'base64').byteLength > MAX_LOGO_BYTES) {
        return NextResponse.json({ success: false, error: 'Use a JPG, PNG, or WebP logo up to 8 MB.' }, { status: 400 });
      }
    }

    const settings: StoredShopSettings = {
      shopName,
      description,
      ...(logoUrl ? { logoUrl } : {}),
    };

    const shopNameUpdated = await updateSellerShopNameServer(email, shopName);
    if (!shopNameUpdated) {
      return NextResponse.json({ success: false, error: 'Could not save the shop name. Please try again.' }, { status: 500 });
    }
    if (!saveSellerShopSettingsServer(email, settings)) {
      return NextResponse.json({ success: false, error: 'Could not save shop settings. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Could not save shop settings.' }, { status: 500 });
  }
}
