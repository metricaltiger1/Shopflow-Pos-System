import React from 'react';

interface CustomAvatarProps {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
}

export const CustomAvatar: React.FC<CustomAvatarProps> = ({ 
  src, 
  alt, 
  fallback, 
  className = '' 
}) => {
  const [imageError, setImageError] = React.useState(false);
  const hasValidImage = src && src.trim() !== '' && !imageError;

  React.useEffect(() => {
    setImageError(false); // Reset error state when src changes
  }, [src]);

  return (
    <div className={`rounded-full flex items-center justify-center overflow-hidden ${className}`}>
      {hasValidImage ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center font-medium">
          {fallback}
        </div>
      )}
    </div>
  );
};