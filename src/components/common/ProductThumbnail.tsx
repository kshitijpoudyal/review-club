import React, { useState } from 'react';

interface ProductThumbnailProps {
  imageUrl?: string;
  productName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProductThumbnail: React.FC<ProductThumbnailProps> = ({
  imageUrl,
  productName,
  size = 'md',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Size configurations
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const showPlaceholder = !imageUrl || imageError;

  return (
    <div className={`${sizeClasses[size]} rounded-xl overflow-hidden bg-muted ring-1 ring-border/70 flex-shrink-0 ${className}`}>
      {showPlaceholder ? (
        // Placeholder with package icon
        <div className="w-full h-full bg-gradient-to-br from-muted to-surface-variant flex items-center justify-center">
          <svg
            className={`${iconSizes[size]} text-muted-foreground`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
      ) : (
        <>
          {/* Loading state */}
          {imageLoading && (
            <div className="w-full h-full bg-surface-variant animate-pulse flex items-center justify-center">
              <div className={`${iconSizes[size]} bg-input rounded`}></div>
            </div>
          )}
          {/* Actual image */}
          <img
            src={imageUrl}
            alt={productName}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};

export default ProductThumbnail;