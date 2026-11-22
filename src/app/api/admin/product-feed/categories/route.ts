import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import {
  addStorehouseProductFeedCategory,
  readStorehouseProductFeedCategoryDeletionState,
  StorehouseProductFeedCategoryConflictError,
} from '@/lib/storehouseProductFeedCategoriesServer';
import { deleteAllProductFeedCategoriesEverywhere, deleteProductFeedCategoryEverywhere } from '@/lib/productFeedCategoryDeletionServer';
import { readAdminProductCategoryCounts } from '@/lib/adminProductCategoryCountsServer';
import { withProductFeedCategoryWrite } from '@/lib/productFeedCategoryStorage';
import { addProductFeedCategoriesEverywhere, readProductFeedCategoryLists } from '@/lib/productFeedSharedCategoriesServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  }
  const lists = readProductFeedCategoryLists();
  const counts = await readAdminProductCategoryCounts();
  return NextResponse.json({
    success: true,
    categories: lists.storehouseCategories,
    ...lists,
    ...counts,
    ...readStorehouseProductFeedCategoryDeletionState(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  }

  let body: { kind?: string; name?: string; names?: unknown; categorySlug?: string; categoryName?: string; scope?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, error: 'Invalid category request.' }, { status: 400 }); }

  if (body.kind !== 'category' && body.kind !== 'subcategory') {
    return NextResponse.json({ success: false, error: 'Choose a category or subcategory to add.' }, { status: 400 });
  }
  try {
    if (body.scope === 'all-catalogs') {
      return NextResponse.json({ success: true, ...await addProductFeedCategoriesEverywhere(body) }, { status: 201 });
    }
    const kind = body.kind;
    const categories = await withProductFeedCategoryWrite(() => addStorehouseProductFeedCategory({
      kind,
      name: typeof body.name === 'string' ? body.name : '',
      names: Array.isArray(body.names) && body.names.every((item) => typeof item === 'string') ? body.names as string[] : undefined,
      categorySlug: body.categorySlug,
    }));
    return NextResponse.json({ success: true, categories }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save the Storehouse category.';
    const status = /already exists/i.test(message) ? 409 : 400;
    const existing = error instanceof StorehouseProductFeedCategoryConflictError ? error.existing : undefined;
    return NextResponse.json({ success: false, error: message, ...(existing ? { existing } : {}) }, { status });
  }
}

export async function DELETE(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  }

  let body: { kind?: string; categorySlug?: string; categoryName?: string; subcategorySlug?: string; subcategoryName?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, error: 'Invalid category deletion request.' }, { status: 400 }); }

  try {
    if (body.kind === 'all-categories') {
      const result = await deleteAllProductFeedCategoriesEverywhere();
      return NextResponse.json({ success: true, ...result });
    }
    const result = await deleteProductFeedCategoryEverywhere({
      kind: body.kind,
      categorySlug: body.categorySlug,
      categoryName: body.categoryName,
      subcategorySlug: body.subcategorySlug,
      subcategoryName: body.subcategoryName,
    });
    return NextResponse.json({ success: true, ...result, mainStoreCategories: result.categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete this category.';
    const status = /not found/i.test(message) ? 404 : /choose|select|provide/i.test(message) ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
