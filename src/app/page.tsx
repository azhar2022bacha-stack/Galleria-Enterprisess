import HeroBanner from '@/components/home/HeroBanner';
import CategoryIcons from '@/components/home/CategoryIcons';
import FeaturedCollection from '@/components/home/FeaturedCollection';
import CompanyOverview from '@/components/home/CompanyOverview';
import ServiceBenefits from '@/components/home/ServiceBenefits';
import NewsletterSection from '@/components/home/NewsletterSection';

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <CategoryIcons />
      <FeaturedCollection />
      <CompanyOverview />
      <ServiceBenefits />
      <NewsletterSection />
    </>
  );
}
