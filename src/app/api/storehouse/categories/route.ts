import { NextResponse } from 'next/server';
import {
  readStorehouseProductFeedCategories,
  readStorehouseProductFeedCategoryDeletionState,
} from '@/lib/storehouseProductFeedCategoriesServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    success: true,
    categories: readStorehouseProductFeedCategories(),
    ...readStorehouseProductFeedCategoryDeletionState(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
