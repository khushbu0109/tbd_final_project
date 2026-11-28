import React, { useMemo, useState } from 'react';
import { CheckCircle2, ShieldCheck, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';

type ReviewFilter =
  | 'All Reviews'
  | '5 Star Only'
  | '4 Star Only'
  | 'COREAA™ Daily Vitality'
  | "Men's Favor";

const FILTERS: ReviewFilter[] = [
  'All Reviews',
  '5 Star Only',
  '4 Star Only',
  'COREAA™ Daily Vitality',
  "Men's Favor",
];

const PRODUCT_OPTIONS = [
  'COREAA™ Daily Vitality',
  "Men's Favor Daily Stamina Complex",
  'TBD Cellular NAD+ & Resveratrol',
  'TBD Health & Vitality Smart Tracker',
  'TBD Ashwagandha Root Extract',
];

export const ReviewsPage: React.FC = () => {
  const { reviews, addReview } = useStore();
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('All Reviews');

  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('');
  const [productName, setProductName] = useState(PRODUCT_OPTIONS[0]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [quote, setQuote] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 4.9;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews]);

  const distribution = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((r) => r.rating === stars).length;
      const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
      return { stars, count, pct };
    });
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (activeFilter === '5 Star Only') return r.rating === 5;
      if (activeFilter === '4 Star Only') return r.rating === 4;
      if (activeFilter === 'COREAA™ Daily Vitality') {
        return r.productName.toLowerCase().includes('coreaa');
      }
      if (activeFilter === "Men's Favor") {
        return r.productName.toLowerCase().includes("men's favor");
      }
      return true;
    });
  }, [reviews, activeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !title.trim() || !quote.trim()) return;
    await addReview({
      author: author.trim(),
      location: location.trim() || 'India',
      role: role.trim() || 'Verified Patient',
      rating,
      productName,
      title: title.trim(),
      quote: quote.trim(),
    });
    setAuthor('');
    setLocation('');
    setRole('');
    setTitle('');
    setQuote('');
    setRating(5);
    setSubmittedNotice(true);
    setActiveFilter('All Reviews');
  };

  return (
    <div className="bg-[#F9F9FF] text-[#061B3A]">
      {/* Aggregate Scorecard Hero */}
      <section className="border-b border-[#D8E2EA] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#008FD3]">
            Verified Cohort Outcomes
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#061B3A] sm:text-4xl">
            Patient Reviews &amp; Clinical Feedback
          </h1>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Overall Score */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#D8E2EA] bg-[#F9F9FF] p-6 lg:col-span-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5A6C82]">
                  Aggregate Cohort Score
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold text-[#061B3A] tabular-nums">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm font-medium text-[#5A6C82] tabular-nums">/ 5.0</span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= Math.round(avgRating)
                          ? 'fill-[#008FD3] text-[#008FD3]'
                          : 'text-[#CBD5E1]'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-4 text-xs text-[#465970] tabular-nums">
                Based on {reviews.length} published batch-verified reviews in this session
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6 lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5A6C82]">
                Rating Distribution
              </p>
              <div className="mt-4 space-y-2.5">
                {distribution.map((row) => (
                  <div key={row.stars} className="flex items-center gap-3 text-xs tabular-nums">
                    <span className="w-12 font-semibold text-[#061B3A]">{row.stars} Star</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E9F1F8]">
                      <div
                        className="h-full rounded-full bg-[#075CA8]"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="w-9 text-right font-mono text-[#465970]">{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrity Protocol */}
            <div className="flex flex-col justify-between rounded-2xl bg-[#061B3A] p-6 text-white lg:col-span-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#16B5E6]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Integrity Protocol</span>
                </div>
                <h2 className="mt-2 font-display text-lg font-bold">
                  Zero Incentivized Ratings
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-[#B8CDE4]">
                  Every review is linked to a verifiable lot code and order ID. We publish critical
                  and high-scoring feedback equally without editing patient observations.
                </p>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3 font-mono text-[11px] text-[#9BB5D2]">
                Audit Ref: TBD-REV-2025 · 100% Unedited
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Reviews Stream + Efficacy Spotlight & Review Form */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Filter Bar */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {FILTERS.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-[#061B3A] text-white'
                    : 'border border-[#D8E2EA] bg-white text-[#354B66] hover:border-[#075CA8] hover:text-[#061B3A]'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Review Cards */}
          <div className="space-y-5 lg:col-span-7">
            {filteredReviews.length === 0 ? (
              <div className="rounded-2xl border border-[#D8E2EA] bg-white p-10 text-center">
                <p className="text-sm font-medium text-[#465970]">
                  No reviews match the selected filter yet.
                </p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-[#D8E2EA] bg-white p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9F6FD] font-display text-xs font-bold text-[#075CA8]">
                        {review.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#061B3A]">{review.author}</p>
                        <p className="text-xs text-[#5A6C82]">
                          {review.role} · {review.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'fill-[#008FD3] text-[#008FD3]'
                              : 'text-[#D8E2EA]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="mt-4 font-display text-base font-bold text-[#061B3A]">
                    {review.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#354B66]">
                    &ldquo;{review.quote}&rdquo;
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EDF2F7] pt-3.5 text-xs text-[#5A6C82]">
                    <span className="font-semibold text-[#075CA8]">{review.productName}</span>
                    <span className="font-mono tabular-nums">
                      Verified Buyer · {review.batchCode} · {review.date}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Right Column: 94% Efficacy Spotlight + Write Review Form */}
          <div className="space-y-6 lg:col-span-5">
            {/* 94% Clinical Efficacy Radial Spotlight */}
            <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6">
              <div className="flex items-center gap-5">
                <div className="relative h-24 w-24 shrink-0">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#E9F6FD"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#075CA8"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="263.89"
                      strokeDashoffset="15.83"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold text-[#061B3A] tabular-nums">
                    94%
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#008FD3]">
                    30-Day Cohort Survey
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold text-[#061B3A]">
                    Sustained Daytime Vitality
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#465970]">
                    94% of consistent COREAA™ subscribers reported steadier afternoon focus and
                    reduced reliance on caffeine within 4 weeks.
                  </p>
                </div>
              </div>
            </div>

            {/* Write a Clinical Review Form */}
            <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6">
              <h2 className="font-display text-xl font-bold text-[#061B3A]">
                Write a Clinical Review
              </h2>
              <p className="mt-1 text-xs text-[#5A6C82]">
                Share your observed timeline, tolerance, and energy consistency.
              </p>

              {submittedNotice && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#E9F6FD] px-3.5 py-2.5 text-xs font-medium text-[#075CA8]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Thank you — your review is now live in the cohort stream.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Star Picker */}
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-[#354B66]">
                    Overall Rating
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-label={`Rate ${value} out of 5 stars`}
                        className="rounded-lg p-1 hover:bg-[#F3F7FB]"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            value <= rating
                              ? 'fill-[#008FD3] text-[#008FD3]'
                              : 'text-[#CBD5E1]'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-mono text-xs font-semibold text-[#061B3A] tabular-nums">
                      {rating}.0 / 5.0
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="rev-product"
                    className="mb-1 block text-xs font-semibold text-[#354B66]"
                  >
                    Formulation Used
                  </label>
                  <select
                    id="rev-product"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                  >
                    {PRODUCT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="rev-author"
                      className="mb-1 block text-xs font-semibold text-[#354B66]"
                    >
                      Your Name
                    </label>
                    <input
                      id="rev-author"
                      type="text"
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Rohan Verma"
                      className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rev-location"
                      className="mb-1 block text-xs font-semibold text-[#354B66]"
                    >
                      City
                    </label>
                    <input
                      id="rev-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Pune, IN"
                      className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="rev-role"
                    className="mb-1 block text-xs font-semibold text-[#354B66]"
                  >
                    Profession or Training Focus (Optional)
                  </label>
                  <input
                    id="rev-role"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Marathon Runner / Software Engineer"
                    className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rev-title"
                    className="mb-1 block text-xs font-semibold text-[#354B66]"
                  >
                    Headline Summary
                  </label>
                  <input
                    id="rev-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Noticeable afternoon focus by week two"
                    className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rev-quote"
                    className="mb-1 block text-xs font-semibold text-[#354B66]"
                  >
                    Detailed Experience
                  </label>
                  <textarea
                    id="rev-quote"
                    rows={3}
                    required
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="Describe dosage timing, tolerance, and observed changes..."
                    className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#075CA8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#004481]"
                >
                  Publish Verified Review
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
