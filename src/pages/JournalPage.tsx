import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Clock, User, X } from 'lucide-react';
import { JOURNAL_ARTICLES, STUDIO_MEDIA } from '../data/catalog';
import { api } from '../services/api';
import { ResilientImage } from '../components/ResilientImage';
import { useStore } from '../context/StoreContext';
import type { JournalArticle } from '../types';

const JOURNAL_CATEGORIES: Array<'All Articles' | JournalArticle['category']> = [
  'All Articles',
  'Nutrition',
  'Fitness & Lifestyle',
  'Ingredients',
  'Wellness',
];

function hydrateArticleImage(article: JournalArticle): JournalArticle {
  if (article.image === '/images/ing-l-citrulline.png') {
    return { ...article, image: STUDIO_MEDIA.ingLCitrulline };
  }
  if (article.image === '/images/ing-ashwagandha.png') {
    return { ...article, image: STUDIO_MEDIA.ingAshwagandha };
  }
  if (article.image === '/images/ing-astaxanthin.png') {
    return { ...article, image: STUDIO_MEDIA.ingAstaxanthin };
  }
  return article;
}

export const JournalPage: React.FC = () => {
  const { showToast } = useStore();
  const [articles, setArticles] = useState<JournalArticle[]>(JOURNAL_ARTICLES);
  const [selectedCategory, setSelectedCategory] = useState<
    'All Articles' | JournalArticle['category']
  >('All Articles');
  const [activeArticle, setActiveArticle] = useState<JournalArticle | null>(null);
  const [digestEmail, setDigestEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    api
      .getBlogs()
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) {
          setArticles(rows.map(hydrateArticleImage));
        }
      })
      .catch(() => {
        // Keep seeded articles if request fails
      });
  }, []);

  const featuredArticle = useMemo(
    () => articles.find((a) => a.featured) ?? articles[0],
    [articles]
  );

  const filteredArticles = useMemo(() => {
    const rest = articles.filter((a) => a.id !== featuredArticle?.id);
    if (selectedCategory === 'All Articles') return rest;
    return articles.filter((a) => a.category === selectedCategory);
  }, [selectedCategory, featuredArticle, articles]);

  const handleDigestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!digestEmail.trim() || !digestEmail.includes('@')) return;
    try {
      await api.subscribeNewsletter(digestEmail.trim(), 'Journal Digest');
      setSubscribed(true);
      setDigestEmail('');
      showToast('Subscribed to the Clinical Research Protocol Digest (saved to MySQL)');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Subscription failed');
    }
  };

  return (
    <div className="bg-[#F9F9FF] text-[#061B3A]">
      {/* Header */}
      <section className="border-b border-[#D8E2EA] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#008FD3]">
            Clinical Research &amp; Formulation Notes
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#061B3A] sm:text-4xl">
            TBD Wellness Journal
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#465970] sm:text-base">
            Evidence-based essays on bioavailability, adaptogen standardization, circadian biology,
            and sustainable daily energy authored by our formulation scientists.
          </p>

          <div className="mt-7 flex flex-wrap gap-2 border-t border-[#E6EEF5] pt-6">
            {JOURNAL_CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? 'bg-[#061B3A] text-white'
                      : 'border border-[#D8E2EA] bg-white text-[#354B66] hover:border-[#075CA8] hover:text-[#061B3A]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Assay Banner */}
      {selectedCategory === 'All Articles' && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <article className="overflow-hidden rounded-2xl border border-[#D8E2EA] bg-white shadow-[0_14px_34px_rgba(6,27,58,0.06)]">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <ResilientImage
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="h-full min-h-[280px] w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:col-span-7">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#008FD3]">
                  <span className="font-semibold uppercase tracking-wider">
                    {featuredArticle.digestNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#465970]">{featuredArticle.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#465970]">{featuredArticle.readTime}</span>
                </div>

                <h2 className="mt-3 font-display text-2xl font-bold leading-snug text-[#061B3A] sm:text-3xl">
                  {featuredArticle.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#465970] sm:text-base">
                  {featuredArticle.excerpt}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#E6EEF5] pt-5">
                  <div className="flex items-center gap-2.5 text-xs text-[#465970]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E9F6FD] font-semibold text-[#075CA8]">
                      RS
                    </div>
                    <div>
                      <p className="font-semibold text-[#061B3A]">{featuredArticle.author}</p>
                      <p>{featuredArticle.authorRole} · {featuredArticle.date}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveArticle(featuredArticle)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#075CA8] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#004481]"
                  >
                    <span>Read Full Assay</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* Articles Grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#D8E2EA] bg-white transition hover:border-[#008FD3]/60 hover:shadow-[0_12px_28px_rgba(6,27,58,0.07)]"
            >
              <button
                type="button"
                onClick={() => setActiveArticle(article)}
                className="aspect-[16/9] w-full overflow-hidden bg-[#F3F7FB] text-left"
              >
                <ResilientImage
                  src={article.image}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </button>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2 text-xs text-[#5A6C82]">
                  <span className="font-semibold text-[#075CA8]">{article.digestNumber}</span>
                  <span>·</span>
                  <span>{article.category}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {article.readTime}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveArticle(article)}
                  className="mt-2.5 text-left"
                >
                  <h3 className="font-display text-xl font-bold leading-snug text-[#061B3A] group-hover:text-[#075CA8]">
                    {article.title}
                  </h3>
                </button>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-[#465970]">
                  {article.excerpt}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-[#EDF2F7] pt-4 text-xs">
                  <span className="font-medium text-[#465970]">
                    {article.author} · {article.date}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveArticle(article)}
                    className="inline-flex items-center gap-1 font-semibold text-[#075CA8] hover:text-[#004481]"
                  >
                    <span>Read Digest</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Research Protocol Digest Subscription */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#061B3A] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#16B5E6]">
              <BookOpen className="h-4 w-4" />
              <span>Monthly Research Protocol Digest</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">
              Receive New Clinical Assays &amp; Formulation Briefs
            </h2>
            <p className="mt-2 text-sm text-[#B8CDE4]">
              One concise peer-reviewed breakdown per month from Dr. Rhea Sen and the TBD Wellness
              formulation lab. No promotional noise.
            </p>
          </div>

          <div className="mt-6 w-full max-w-md lg:mt-0">
            {subscribed ? (
              <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-4 py-3.5 text-sm font-medium text-[#E9F6FD]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#16B5E6]" />
                <span>You are subscribed to the next monthly clinical brief.</span>
              </div>
            ) : (
              <form onSubmit={handleDigestSubmit} className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="email"
                  required
                  value={digestEmail}
                  onChange={(e) => setDigestEmail(e.target.value)}
                  placeholder="Enter your work or personal email"
                  className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-[#9BB5D2] focus:border-[#16B5E6] focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#008FD3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16B5E6]"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Article Reader Modal */}
      {activeArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#061B3A]/65 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={activeArticle.title}
          onClick={() => setActiveArticle(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#D8E2EA] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E6EEF5] bg-white/95 px-6 py-4 backdrop-blur-xs">
              <div className="text-xs font-medium text-[#5A6C82]">
                {activeArticle.digestNumber} · {activeArticle.category} · {activeArticle.readTime}
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="Close article reader"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#465970] hover:bg-[#F3F7FB] hover:text-[#061B3A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <ResilientImage
                src={activeArticle.image}
                alt={activeArticle.title}
                className="aspect-[16/9] w-full rounded-xl object-cover"
              />

              <h2 className="mt-6 font-display text-2xl font-bold leading-snug text-[#061B3A] sm:text-3xl">
                {activeArticle.title}
              </h2>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-[#E6EEF5] pb-5 text-xs text-[#465970]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#061B3A]">
                  <User className="h-3.5 w-3.5 text-[#075CA8]" />
                  {activeArticle.author}
                </span>
                <span>·</span>
                <span>{activeArticle.authorRole}</span>
                <span>·</span>
                <span>{activeArticle.date}</span>
                {activeArticle.studyRef && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-[#075CA8]">{activeArticle.studyRef}</span>
                  </>
                )}
              </div>

              <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#2C4058] sm:text-base">
                {activeArticle.body.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
