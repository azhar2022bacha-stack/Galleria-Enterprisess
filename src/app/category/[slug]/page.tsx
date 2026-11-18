import CategoryListing from '@/components/category/CategoryListing';

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return <CategoryListing categorySlug={params.slug} />;
}
