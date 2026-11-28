import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FlaskConical,
  Maximize2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface CoaSlide {
  id: string;
  src: string;
  pageLabel: string;
  title: string;
  subtitle: string;
  alt: string;
}

const COA_SLIDES: readonly CoaSlide[] = [
  {
    id: 'coa-page-1',
    src: '/assets/aistudio/COA_COREAA_T261718_page-0001_033529b1.jpg',
    pageLabel: 'Page 1 of 3',
    title: 'COREAA Tablets — Certificate of Analysis (Page 1 of 3)',
    subtitle: 'Batch T261718 · Description, Identification, Weight Uniformity, Disintegration & Ashwagandha Assay',
    alt: 'COREAA Tablets Finished Product Certificate of Analysis Page 1 of 3 for Batch T261718 issued by Bajaj Nutraceuticals',
  },
  {
    id: 'coa-page-2',
    src: '/assets/aistudio/COA_COREAA_T261718_page-0002_25a758d4.jpg',
    pageLabel: 'Page 2 of 3',
    title: 'COREAA Tablets — Certificate of Analysis (Page 2 of 3)',
    subtitle: 'Batch T261718 · L-Arginine, L-Citrulline, L-Theanine, Taurine, Ginseng, Magnesium Bisglycinate, Zinc & Antioxidants',
    alt: 'COREAA Tablets Finished Product Certificate of Analysis Page 2 of 3 for Batch T261718 showing laboratory assay results',
  },
  {
    id: 'coa-page-3',
    src: '/assets/aistudio/COA_COREAA_T261718_page-0003_6f12c27d.jpg',
    pageLabel: 'Page 3 of 3',
    title: 'COREAA Tablets — Certificate of Analysis (Page 3 of 3)',
    subtitle: 'Batch T261718 · Piperine 95%, Selenium, Vitamin Spectrum, Compliance Remarks & QC Sign-Off',
    alt: 'COREAA Tablets Finished Product Certificate of Analysis Page 3 of 3 for Batch T261718 showing Piperine, Selenium, Vitamins and QC approval signatures',
  },
];

const QA_POINTS = [
  {
    icon: FlaskConical,
    title: 'Batch Tested',
    description: 'Quality checks for the COREAA formulation.',
  },
  {
    icon: FileCheck2,
    title: 'Transparent Documentation',
    description: 'Access the actual product testing documents.',
  },
  {
    icon: ClipboardCheck,
    title: 'Quality Control',
    description: 'Finished product analysis documentation.',
  },
];

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

function formatSlideIndex(index: number, total: number): string {
  const current = String(index + 1).padStart(2, '0');
  const max = String(total).padStart(2, '0');
  return `${current} / ${max}`;
}

function getTouchDistance(touches: React.TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export const CoaCarouselSection: React.FC = () => {
  const totalSlides = COA_SLIDES.length;
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Carousel swipe / drag state
  const trackViewportRef = useRef<HTMLDivElement | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragRef = useRef<{
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
  const didDragRef = useRef<boolean>(false);

  // Independent full-screen lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isLightboxVisible, setIsLightboxVisible] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const closeTimerRef = useRef<number | null>(null);
  const triggerElRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(
    null
  );
  const pinchStartRef = useRef<{ distance: number; startZoom: number } | null>(null);
  const lightboxSwipeRef = useRef<{ x: number; y: number } | null>(null);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const commitCarouselSwipe = useCallback(
    (deltaX: number) => {
      const width = trackViewportRef.current?.clientWidth ?? 320;
      const threshold = Math.max(44, Math.min(90, width * 0.14));
      if (deltaX <= -threshold) {
        goNext();
      } else if (deltaX >= threshold) {
        goPrev();
      }
    },
    [goNext, goPrev]
  );

  // Touch swipe handlers for the carousel
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    dragRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      axisLock: null,
    };
    didDragRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state.active || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;
    state.lastX = touch.clientX;

    if (state.axisLock === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      state.axisLock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    if (state.axisLock === 'x') {
      didDragRef.current = true;
      setIsDragging(true);
      setDragOffset(dx);
    }
  };

  const handleTouchEnd = () => {
    const state = dragRef.current;
    if (!state.active) return;
    const dx = state.lastX - state.startX;
    const wasHorizontal = state.axisLock === 'x';
    state.active = false;
    state.axisLock = null;

    if (wasHorizontal && didDragRef.current) {
      commitCarouselSwipe(dx);
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 40);
    }
    setDragOffset(0);
    setIsDragging(false);
  };

  // Lightbox helpers
  const resetZoom = useCallback(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsPanning(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomScale((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomScale((prev) => {
      const next = Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2)));
      if (next <= 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const openLightbox = (index: number, triggerEl: HTMLElement | null) => {
    if (didDragRef.current) return;
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    triggerElRef.current = triggerEl;
    resetZoom();
    setLightboxIndex(index);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsLightboxVisible(true);
      });
    });
  };

  const closeLightbox = useCallback(() => {
    setIsLightboxVisible(false);
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setLightboxIndex(null);
      resetZoom();
      closeTimerRef.current = null;
      triggerElRef.current?.focus();
    }, 200);
  }, [resetZoom]);

  const lightboxNext = useCallback(() => {
    resetZoom();
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % totalSlides));
  }, [resetZoom, totalSlides]);

  const lightboxPrev = useCallback(() => {
    resetZoom();
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + totalSlides) % totalSlides));
  }, [resetZoom, totalSlides]);

  // Body scroll lock & keyboard shortcuts when lightbox is open
  useEffect(() => {
    if (lightboxIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        lightboxNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        lightboxPrev();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, closeLightbox, lightboxNext, lightboxPrev, handleZoomIn, handleZoomOut, resetZoom]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Mouse panning when zoomed inside lightbox
  useEffect(() => {
    if (!isPanning) return;

    const onMouseMove = (e: MouseEvent) => {
      const start = panStartRef.current;
      if (!start) return;
      setPanOffset({
        x: start.originX + (e.clientX - start.x),
        y: start.originY + (e.clientY - start.y),
      });
    };

    const onMouseUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isPanning]);

  const activeSlide = COA_SLIDES[activeIndex];
  const activeLightboxSlide = lightboxIndex !== null ? COA_SLIDES[lightboxIndex] : null;

  return (
    <section
      id="quality-coa"
      aria-labelledby="quality-coa-heading"
      className="relative w-full bg-gradient-to-b from-[#041838] via-[#061B3A] to-[#04132C] text-white border-t border-white/10 py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      <div className="max-w-[1320px] mx-auto px-5 lg:px-10 space-y-10 sm:space-y-12">
        {/* Centered Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-mono font-semibold uppercase tracking-[0.18em] text-[#16B5E6]">
            QUALITY ASSURANCE · LAB VERIFIED
          </p>
          <h2
            id="quality-coa-heading"
            className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white"
          >
            Quality You Can Verify.
          </h2>
          <p className="text-sm sm:text-base text-[#D7E2FF] leading-relaxed">
            Transparency, precision, and quality assurance — backed by laboratory-tested results.
          </p>
        </div>

        {/* Centered COA Carousel Stage */}
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="COREAA Certificate of Analysis documents"
          className="relative max-w-4xl mx-auto"
        >
          {/* Desktop / Tablet Side Arrows */}
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous Certificate of Analysis page"
            className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-[#061B3A]/90 hover:bg-[#075CA8] text-white border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B5E6] transition-colors cursor-pointer absolute -left-6 lg:-left-16 top-1/2 -translate-y-1/2 z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next Certificate of Analysis page"
            className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-[#061B3A]/90 hover:bg-[#075CA8] text-white border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B5E6] transition-colors cursor-pointer absolute -right-6 lg:-right-16 top-1/2 -translate-y-1/2 z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Glass-Style Outer Document Frame */}
          <div className="rounded-3xl bg-white/[0.04] border border-white/12 p-3 sm:p-5 lg:p-6 shadow-[0_28px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xs">
            {/* Document Top Meta Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3.5 sm:pb-4 border-b border-white/10">
              <div className="min-w-0">
                <p className="font-display text-sm sm:text-base font-semibold text-white truncate">
                  {activeSlide.title}
                </p>
                <p className="text-xs text-[#90CDFF]/85 truncate mt-0.5">{activeSlide.subtitle}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs sm:text-sm font-semibold text-[#52B9FF] tabular-nums">
                  {formatSlideIndex(activeIndex, totalSlides)}
                </span>
              </div>
            </div>

            {/* Sliding Viewport */}
            <div
              ref={trackViewportRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              className="mt-4 overflow-hidden rounded-2xl touch-pan-y"
            >
              <div
                className={`flex w-full will-change-transform ${
                  isDragging
                    ? 'transition-none'
                    : 'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'
                }`}
                style={{
                  transform: `translate3d(calc(-${activeIndex * 100}% + ${dragOffset}px), 0, 0)`,
                }}
              >
                {COA_SLIDES.map((slide, idx) => (
                  <div key={slide.id} className="w-full shrink-0 px-0.5">
                    <button
                      type="button"
                      onClick={(e) => openLightbox(idx, e.currentTarget)}
                      aria-label={`Open ${slide.title} in full-screen document viewer`}
                      className="group relative w-full rounded-2xl bg-white p-2.5 sm:p-5 shadow-[0_14px_40px_rgba(0,0,0,0.35)] border border-white/80 flex items-center justify-center overflow-hidden cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B5E6]"
                    >
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        draggable={false}
                        className="w-full h-[420px] sm:h-[540px] lg:h-[620px] object-contain transition-transform duration-300 ease-out group-hover:scale-[1.015] select-none"
                      />

                      {/* Subtle Inspect Affordance */}
                      <span
                        aria-hidden="true"
                        className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#061B3A]/88 text-white text-xs font-medium border border-white/15 shadow-md backdrop-blur-xs opacity-95 sm:opacity-85 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-[#16B5E6]" />
                        <span>Inspect Full Screen</span>
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Controls: Pagination Dots, Mobile Arrows & Slide Counter */}
            <div className="mt-5 flex items-center justify-between gap-3 px-1">
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#D7E2FF]/80">
                <ZoomIn className="w-3.5 h-3.5 text-[#16B5E6] shrink-0" />
                <span>Click document to open full-screen zoom viewer</span>
              </div>

              <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
                {/* Mobile Previous Arrow */}
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous Certificate of Analysis page"
                  className="md:hidden flex items-center justify-center w-11 h-11 rounded-full bg-white/8 hover:bg-white/15 text-white border border-white/15 transition-colors cursor-pointer shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Pagination Dots */}
                <div
                  className="flex items-center gap-2"
                  role="group"
                  aria-label="Certificate page pagination"
                >
                  {COA_SLIDES.map((slide, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`View ${slide.pageLabel}`}
                        aria-current={isActive ? 'true' : undefined}
                        className="py-2 px-0.5 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B5E6] rounded-full"
                      >
                        <span
                          className={`block h-2 rounded-full transition-all duration-300 ${
                            isActive
                              ? 'w-8 bg-[#16B5E6]'
                              : 'w-2 bg-white/30 hover:bg-white/55'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Mobile Next Arrow */}
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next Certificate of Analysis page"
                  className="md:hidden flex items-center justify-center w-11 h-11 rounded-full bg-white/8 hover:bg-white/15 text-white border border-white/15 transition-colors cursor-pointer shrink-0"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Three Minimal Information Points */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 pt-2">
          {QA_POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/10"
              >
                <div className="w-9 h-9 rounded-xl bg-[#16B5E6]/12 text-[#16B5E6] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" strokeWidth={1.9} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-semibold text-white">{point.title}</h3>
                  <p className="text-xs text-[#D7E2FF]/80 mt-1 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-Screen Professional Document Lightbox Viewer */}
      {activeLightboxSlide &&
        lightboxIndex !== null &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${activeLightboxSlide.title} full-screen document viewer`}
            onClick={closeLightbox}
            className={`fixed inset-0 z-[110] flex flex-col justify-between bg-[#020A17]/95 backdrop-blur-md transition-opacity duration-200 ${
              isLightboxVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top Viewer Toolbar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-[#031024]/85 shrink-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs sm:text-sm font-semibold text-[#52B9FF] tabular-nums shrink-0">
                  {formatSlideIndex(lightboxIndex, totalSlides)}
                </span>
                <span className="text-white/25 hidden sm:inline" aria-hidden="true">
                  |
                </span>
                <p className="font-display text-xs sm:text-sm font-semibold text-white truncate">
                  {activeLightboxSlide.title}
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Document Zoom Controls */}
                <div className="flex items-center gap-1 rounded-full bg-white/8 border border-white/15 p-1">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomScale <= MIN_ZOOM}
                    aria-label="Zoom out document"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[11px] sm:text-xs text-white/90 tabular-nums px-1.5 min-w-[44px] text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomScale >= MAX_ZOOM}
                    aria-label="Zoom in document"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  {zoomScale > 1 && (
                    <button
                      type="button"
                      onClick={resetZoom}
                      aria-label="Reset document zoom"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#52B9FF] hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Close Lightbox Button */}
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={closeLightbox}
                  aria-label="Close full-screen document viewer"
                  className="w-11 h-11 rounded-full bg-white/12 hover:bg-white/24 text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B5E6]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Stage with Navigation Arrows, Pinch-to-Zoom & Pan */}
            <div
              className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden px-3 sm:px-20 py-4"
              onTouchStart={(e) => {
                if (e.touches.length === 2) {
                  pinchStartRef.current = {
                    distance: getTouchDistance(e.touches),
                    startZoom: zoomScale,
                  };
                  lightboxSwipeRef.current = null;
                } else if (e.touches.length === 1) {
                  if (zoomScale > 1) {
                    panStartRef.current = {
                      x: e.touches[0].clientX,
                      y: e.touches[0].clientY,
                      originX: panOffset.x,
                      originY: panOffset.y,
                    };
                  } else {
                    lightboxSwipeRef.current = {
                      x: e.touches[0].clientX,
                      y: e.touches[0].clientY,
                    };
                  }
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 2 && pinchStartRef.current) {
                  const currentDist = getTouchDistance(e.touches);
                  const ratio = currentDist / pinchStartRef.current.distance;
                  const nextZoom = Math.min(
                    MAX_ZOOM,
                    Math.max(MIN_ZOOM, Number((pinchStartRef.current.startZoom * ratio).toFixed(2)))
                  );
                  setZoomScale(nextZoom);
                  if (nextZoom <= 1) {
                    setPanOffset({ x: 0, y: 0 });
                  }
                } else if (e.touches.length === 1 && zoomScale > 1 && panStartRef.current) {
                  setPanOffset({
                    x: panStartRef.current.originX + (e.touches[0].clientX - panStartRef.current.x),
                    y: panStartRef.current.originY + (e.touches[0].clientY - panStartRef.current.y),
                  });
                }
              }}
              onTouchEnd={(e) => {
                if (e.touches.length < 2) {
                  pinchStartRef.current = null;
                }
                if (e.touches.length === 0) {
                  panStartRef.current = null;
                  const swipeStart = lightboxSwipeRef.current;
                  lightboxSwipeRef.current = null;
                  if (swipeStart && zoomScale <= 1 && e.changedTouches.length === 1) {
                    const dx = e.changedTouches[0].clientX - swipeStart.x;
                    const dy = e.changedTouches[0].clientY - swipeStart.y;
                    if (Math.abs(dx) > 52 && Math.abs(dx) > Math.abs(dy)) {
                      if (dx < 0) {
                        lightboxNext();
                      } else {
                        lightboxPrev();
                      }
                    }
                  }
                }
              }}
            >
              {/* Lightbox Previous Arrow */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxPrev();
                }}
                aria-label="Previous Certificate of Analysis page"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#061B3A]/85 hover:bg-[#075CA8] text-white border border-white/25 shadow-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B5E6]"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Full Uncropped Document Image */}
              <div
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (zoomScale > 1) {
                    resetZoom();
                  } else {
                    setZoomScale(2);
                  }
                }}
                onMouseDown={(e) => {
                  if (zoomScale <= 1 || e.button !== 0) return;
                  e.preventDefault();
                  panStartRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                    originX: panOffset.x,
                    originY: panOffset.y,
                  };
                  setIsPanning(true);
                }}
                className={`flex items-center justify-center ${
                  zoomScale > 1
                    ? isPanning
                      ? 'cursor-grabbing'
                      : 'cursor-grab'
                    : 'cursor-zoom-in'
                }`}
              >
                <img
                  key={activeLightboxSlide.id}
                  src={activeLightboxSlide.src}
                  alt={activeLightboxSlide.alt}
                  draggable={false}
                  style={{
                    transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomScale})`,
                  }}
                  className={`max-w-[92vw] max-h-[78vh] sm:max-w-[82vw] sm:max-h-[80vh] w-auto h-auto object-contain rounded-lg bg-white shadow-[0_24px_80px_rgba(0,0,0,0.75)] select-none ${
                    isPanning ? 'transition-none' : 'transition-transform duration-200 ease-out'
                  }`}
                />
              </div>

              {/* Lightbox Next Arrow */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxNext();
                }}
                aria-label="Next Certificate of Analysis page"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#061B3A]/85 hover:bg-[#075CA8] text-white border border-white/25 shadow-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B5E6]"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Bottom Caption & Quick Page Switcher */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="px-4 sm:px-6 py-3 border-t border-white/10 bg-[#031024]/85 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0"
            >
              <p className="text-xs text-[#D7E2FF]/80 text-center sm:text-left truncate max-w-full">
                {activeLightboxSlide.subtitle}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                {COA_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => {
                      resetZoom();
                      setLightboxIndex(idx);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                      idx === lightboxIndex
                        ? 'bg-[#16B5E6] text-[#061B3A]'
                        : 'bg-white/8 text-white/80 hover:bg-white/15'
                    }`}
                  >
                    {slide.pageLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};
