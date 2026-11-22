import React from 'react';

interface TbdLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LOGO_SRC = '/assets/aistudio/image_51e9f36d.png';

export const TbdLogo: React.FC<TbdLogoProps> = ({
  variant = 'light',
  size = 'md',
  className = '',
}) => {
  const isDark = variant === 'dark';
  const imgHeight = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-10' : 'h-8';

  return (
    <span className={`inline-flex items-center select-none ${className}`}>
      <img
        src={LOGO_SRC}
        alt="TBD"
        referrerPolicy="no-referrer"
        className={`${imgHeight} w-auto object-contain shrink-0 ${
          isDark ? 'brightness-0 invert' : ''
        }`}
      />
    </span>
  );
};
