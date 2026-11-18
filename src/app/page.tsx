import HeroBanner from '@/components/home/HeroBanner';
import CategoryIcons from '@/components/home/CategoryIcons';
import ServiceBenefits from '@/components/home/ServiceBenefits';
import FeaturedCollection from '@/components/home/FeaturedCollection';
import NewsletterSection from '@/components/home/NewsletterSection';

export default function HomePage() {
  return (
    <>
      {/* Editorial storefront hero */}
      <HeroBanner />

      {/* Browse the main departments */}
      <CategoryIcons />

      {/* Store information */}
      <ServiceBenefits />

      {/* Featured products */}
      <FeaturedCollection />

      {/* 7. Newsletter Subscription Section */}
      <NewsletterSection />
    </>
  );
}
