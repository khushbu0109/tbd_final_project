import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getValidHeroImages,
  type HeroMediaInput,
  type HeroProductImage,
} from '../data/catalog';
import { ResilientImage } from './ResilientImage';

interface HeroProductCarouselProps {
  images: HeroProductImage[];
  overlayTitle: string;
  overlayPrice: string;
}

/**
 * Mounted ONLY when 2 or more valid hero images exist.
 * Manual controls only (no autoplay), with touch swipe, prev/next arrows,
 * pagination dots, and automatic slide index clamping on list changes.
 */
const HeroProductCarousel: React.FC<HeroProductCarouselProps> = ({
  images,
  overlayTitle,
  overlayPrice,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const frameRef = useRef<HTMLDivElement | null>(null);
  const touchRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    axisLock: 'x' | 'y' | null;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    axisLock: null,
  });

  const total = images.length;
  const safeIndex = Math.max(0, Math.min(currentIndex, total - 1));

  // Keep slide index valid whenever the image list shrinks or changes
  useEffect(() => {
    setCurrentIndex((prev) => Math.max(0, Math.min(prev, total - 1)));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => {
      const clamped = Math.max(0, Math.min(prev, total - 1));
      return (clamped - 1 + total) % total;
    });
  }, [total]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const clamped = Math.max(0, Math.min(prev, total - 1));
      return (clamped + 1) % total;
    });
  }, [total]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      axisLock: null,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const state = touchRef.current;
    if (!state.active || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;
    state.lastX = touch.clientX;

    if (state.axisLock === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      state.axisLock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    if (state.axisLock === 'x') {
      setIsDragging(true);
      setDragOffset(dx);
    }
  };

  const handleTouchEnd = () => {
    const state = touchRef.current;
    if (!state.active) return;

    const dx = state.lastX - state.startX;
    const wasHorizontal = state.axisLock === 'x';
    state.active = false;
    state.axisLock = null;

    if (wasHorizontal) {
      const width = frameRef.current?.clientWidth ?? 320;
      const threshold = Math.max(40, Math.min(84, width * 0.14));
      if (dx <= -threshold) {
        goNext();
      } else if (dx >= threshold) {
        goPrev();
      }
    }

    setDragOffset(0);
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  return (
    <div
      ref={frameRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="COREAA Daily Vitality product images"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative w-full aspect-[4/3] lg:aspect-auto lg:min-h-[520px] rounded-2xl overflow-hidden border border-white/15 bg-[#03132D] shadow-2xl touch-pan-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B5E6]"
    >
      {/* Sliding Image Track (1 image visible at a time) */}
      <div
        className={`flex w-full h-full will-change-transform ${
          isDragging
            ? 'transition-none'
            : 'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'
        }`}
        style={{
          transform: `translate3d(calc(-${safeIndex * 100}% + ${dragOffset}px), 0, 0)`,
        }}
      >
        {images.map((item, idx) => (
          <div key={`${item.src}-${idx}`} className="w-full h-full shrink-0">
            <ResilientImage
              src={item.src}
              alt={item.alt}
              className="w-full h-full object-cover object-center select-none pointer-events-none"
            />
          </div>
        ))}
      </div>

      {/* Previous & Next Navigation Arrows */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous product image"
        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#03132D]/75 hover:bg-[#075CA8] text-white border border-white/20 backdrop-blur-sm shadow-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B5E6]"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={goNext}
        aria-label="Next product image"
        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#03132D]/75 hover:bg-[#075CA8] text-white border border-white/20 backdrop-blur-sm shadow-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B5E6]"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Fixed Bottom Scrim */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#03132D]/90 via-[#03132D]/35 to-transparent z-10" />

      {/* Pagination Dots */}
      <div
        role="group"
        aria-label="Product image pagination"
        className="absolute bottom-14 sm:bottom-11 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5"
      >
        {images.map((_, idx) => {
          const isActive = idx === safeIndex;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`View product image ${idx + 1} of ${total}`}
              aria-current={isActive ? 'true' : undefined}
              className="py-1.5 px-0.5 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B5E6] rounded-full"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  isActive ? 'w-6 bg-[#16B5E6]' : 'w-1.5 bg-white/45 hover:bg-white/75'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Fixed Product Name & Price Overlay */}
      <div className="absolute bottom-4 left-5 right-5 z-20 flex flex-wrap items-center justify-between gap-2 text-xs text-[#E9F6FD]/95 font-mono">
        <span>{overlayTitle}</span>
        <span>{overlayPrice}</span>
      </div>
    </div>
  );
};

interface HeroProductMediaPanelProps {
  images?: ReadonlyArray<HeroMediaInput | string | null | undefined>;
  fallbackImage?: HeroMediaInput | string | null;
  overlayTitle: string;
  overlayPrice: string;
}

export const HeroProductMediaPanel: React.FC<HeroProductMediaPanelProps> = ({
  images,
  fallbackImage,
  overlayTitle,
  overlayPrice,
}) => {
  const validImages = getValidHeroImages(images);

  // 2 or more valid images -> mount interactive carousel (manual control, no autoplay)
  if (validImages.length >= 2) {
    return (
      <HeroProductCarousel
        images={validImages}
        overlayTitle={overlayTitle}
        overlayPrice={overlayPrice}
      />
    );
  }

  // 1 valid image -> render static image directly, never mounting the carousel
  if (validImages.length === 1) {
    const single = validImages[0];
    return (
      <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:min-h-[520px] rounded-2xl overflow-hidden border border-white/15 bg-[#03132D] shadow-2xl">
        <ResilientImage
          src={single.src}
          alt={single.alt}
          className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#03132D]/85 via-[#03132D]/30 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#E9F6FD]/95 font-mono">
          <span>{overlayTitle}</span>
          <span>{overlayPrice}</span>
        </div>
      </div>
    );
  }

  // 0 valid images -> use fallback if provided and non-empty, otherwise hide media panel gracefully
  const validFallback = getValidHeroImages(fallbackImage ? [fallbackImage] : []);
  if (validFallback.length === 1) {
    const fallback = validFallback[0];
    return (
      <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:min-h-[520px] rounded-2xl overflow-hidden border border-white/15 bg-[#03132D] shadow-2xl">
        <ResilientImage
          src={fallback.src}
          alt={fallback.alt}
          className="w-full h-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#03132D]/85 via-[#03132D]/30 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#E9F6FD]/95 font-mono">
          <span>{overlayTitle}</span>
          <span>{overlayPrice}</span>
        </div>
      </div>
    );
  }

  return null;
};
