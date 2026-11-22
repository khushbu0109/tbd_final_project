import React, { useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#E9F6FD] via-[#F1F3FF] to-[#E8EEFF] text-[#075CA8] p-6 text-center ${className}`}
      >
        <FlaskConical className="w-8 h-8 mb-2 opacity-75" strokeWidth={1.6} />
        <span className="text-xs font-medium text-[#061B3A]/75 line-clamp-2">
          {fallbackLabel ?? alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
