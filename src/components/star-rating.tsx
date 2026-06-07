import { Star } from "lucide-react";

export function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < rating
              ? "h-4 w-4 fill-primary text-primary"
              : "h-4 w-4 text-muted-foreground/40"
          }
          aria-hidden
        />
      ))}
    </div>
  );
}
