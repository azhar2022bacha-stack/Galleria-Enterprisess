import { NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/adminSession';
import { getStoreCategories, readStoreCategoryOverrides, writeStoreCategoryOverrides } from '@/lib/storeCategoriesServer';
import { deleteProductFeedCategoryEverywhere } from '@/lib/productFeedCategoryDeletionServer';
import { withProductFeedCategoryWrite } from '@/lib/productFeedCategoryStorage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function normalizeName(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function slugify(value: string): string {
  return normalizeName(value).replace(/\s+/g, '-').slice(0, 80).replace(/-+$/g, '');
}

export async function GET() {
  return NextResponse.json({ success: true, categories: getStoreCategories() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid category request.' }, { status: 400 }); }

  return withProductFeedCategoryWrite(() => saveCategory(body));
}

function saveCategory(body: any) {
  const kind = String(body?.kind || '');
  const names: string[] = kind === 'subcategory'
    ? (Array.isArray(body?.names) ? body.names : typeof body?.name === 'string' ? body.name.split(',') : [])
      .filter((item: unknown): item is string => typeof item === 'string')
      .map((item: string) => item.trim().replace(/\s+/g, ' '))
      .filter(Boolean)
    : [typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : ''];
  if (!names.length || names.length > (kind === 'subcategory' ? 50 : 1)) {
    return NextResponse.json({ success: false, error: 'Add between 1 and 50 subcategory names at a time.' }, { status: 400 });
  }
  if (names.some((name) => name.length < 2 || name.length > 60)) {
    return NextResponse.json({ success: false, error: 'Each category name must be 2 to 60 characters.' }, { status: 400 });
  }
  const slugs = names.map(slugify);
  if (slugs.some((slug) => !slug)) return NextResponse.json({ success: false, error: 'Use letters or numbers in each category name.' }, { status: 400 });
  if (new Set(slugs).size !== slugs.length) {
    const repeated = names[slugs.findIndex((slug, index) => slugs.indexOf(slug) !== index)];
    return NextResponse.json({
      success: false,
      error: `Subcategory “${repeated}” appears more than once in this list.`,
      existing: { kind: 'subcategory', name: repeated, slug: slugify(repeated) },
    }, { status: 409 });
  }

  const categories = getStoreCategories();
  const overrides = readStoreCategoryOverrides();
  if (kind === 'category') {
    const name = names[0];
    const slug = slugs[0];
    const duplicate = categories.find((category) => category.slug === slug || normalizeName(category.name) === normalizeName(name));
    if (duplicate) {
      return NextResponse.json({
        success: false,
        error: `Main category “${duplicate.name}” already exists.`,
        existing: { kind: 'category', name: duplicate.name, slug: duplicate.slug },
      }, { status: 409 });
    }
    overrides.deletedCategories = overrides.deletedCategories.filter((deletedSlug) => deletedSlug !== slug);
    delete overrides.deletedSubcategories[slug];
    overrides.categories.push({ id: `custom-${slug}`, name, slug, subcategories: [] });
  } else if (kind === 'subcategory') {
    const categorySlug = typeof body?.categorySlug === 'string' ? body.categorySlug.trim() : '';
    const category = categories.find((item) => item.slug === categorySlug);
    if (!category) return NextResponse.json({ success: false, error: 'Choose an existing main category.' }, { status: 400 });
    for (let index = 0; index < names.length; index += 1) {
      const duplicate = category.subcategories.find((subcategory) => subcategory.slug === slugs[index] || normalizeName(subcategory.name) === normalizeName(names[index]));
      if (duplicate) {
        return NextResponse.json({
          success: false,
          error: `Subcategory “${duplicate.name}” already exists under “${category.name}”.`,
          existing: { kind: 'subcategory', name: duplicate.name, slug: duplicate.slug, category: category.name, categorySlug },
        }, { status: 409 });
      }
    }
    overrides.deletedSubcategories[categorySlug] = (overrides.deletedSubcategories[categorySlug] || []).filter((deletedSlug) => !slugs.includes(deletedSlug));
    overrides.subcategories[categorySlug] = [...(overrides.subcategories[categorySlug] || []), ...names.map((name, index) => ({ name, slug: slugs[index] }))];
  } else {
    return NextResponse.json({ success: false, error: 'Choose whether to add a main category or subcategory.' }, { status: 400 });
  }

  writeStoreCategoryOverrides(overrides);
  return NextResponse.json({ success: true, categories: getStoreCategories(), addedSubcategories: kind === 'subcategory' ? names : [] }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await getRequestAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Admin sign-in is required.' }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid category deletion request.' }, { status: 400 }); }
  try {
    const result = await deleteProductFeedCategoryEverywhere({
      kind: body?.kind,
      categorySlug: body?.categorySlug,
      categoryName: body?.categoryName,
      subcategorySlug: body?.subcategorySlug,
      subcategoryName: body?.subcategoryName,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete this category.';
    const status = /not found/i.test(message) ? 404 : /choose|select|provide/i.test(message) ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
