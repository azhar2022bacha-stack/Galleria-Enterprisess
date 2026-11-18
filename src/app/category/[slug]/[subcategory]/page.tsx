import CategoryListing from '@/components/category/CategoryListing';

export default function SubcategoryPage({ params }: { params: { slug: string; subcategory: string } }) {
  return <CategoryListing categorySlug={params.slug} subcategorySlug={params.subcategory} />;
}
