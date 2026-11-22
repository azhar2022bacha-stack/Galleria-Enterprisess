import { Star } from 'lucide-react';

export function ProductRating({ rating, count }: { rating: number; count: number }) {
  const hasReviews = count > 0;
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-600">
      <span aria-hidden="true" className="inline-flex gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} size={12} className={hasReviews && index < Math.round(rating) ? 'fill-amber-500 text-amber-600' : 'fill-slate-200 text-slate-300'} />
        ))}
      </span>
      {hasReviews ? (
        <>
          <span className="font-semibold tabular-nums text-slate-800"><span className="sr-only">Rated </span>{rating.toFixed(1)}<span className="sr-only"> out of 5</span></span>
          <span>({count}<span className="sr-only"> {count === 1 ? 'review' : 'reviews'}</span>)</span>
        </>
      ) : <span>No reviews yet</span>}
    </div>
  );
}
