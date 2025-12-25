interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showNumber = false
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-1">
      <div className={`flex gap-0.5 ${sizeClasses[size]}`}>
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          return (
            <span
              key={index}
              className={
                starValue <= Math.round(rating)
                  ? 'text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }
            >
              ★
            </span>
          );
        })}
      </div>
      {showNumber && (
        <span className={`${sizeClasses[size]} text-gray-700 dark:text-gray-300 font-semibold ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
