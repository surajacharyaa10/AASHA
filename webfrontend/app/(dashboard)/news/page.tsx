"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Newspaper,
  ExternalLink,
  Clock,
  Building2,
  Tag,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NewsArticle {
  title: string;
  link: string;
  description: string;
  content?: string;
  image_url?: string;
  video_url?: string | null;
  published_at: string;
  source_id: string;
  source_priority?: number;
  country: string[];
  category: string[];
  language: string;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  results: NewsArticle[];
}

const CATEGORIES = ["environment", "health", "other", "politics", "tourism"];
const EXCLUDE_LANGUAGES = ["ne", "en"];

const CATEGORY_STYLES: Record<string, string> = {
  environment: "bg-emerald-50 text-emerald-700 border-emerald-200",
  health: "bg-rose-50 text-rose-700 border-rose-200",
  politics: "bg-indigo-50 text-indigo-700 border-indigo-200",
  tourism: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-NP", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kathmandu",
    });
  } catch {
    return dateStr;
  }
}

function stripHtml(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/news/latest');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NewsResponse = await res.json();
      if (data.status === "success" && Array.isArray(data.results)) {
        setArticles(data.results);
      } else {
        setArticles([]);
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch news data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    fetchNews();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" render={<Link href="/dashboard" />} className="h-9 w-9 border-slate-200">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <div>
            <p className="text-xs font-medium text-slate-400">Aasha Operations</p>
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-red-600" />
              <h1 className="text-lg font-bold text-slate-900">News Feed</h1>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 border-slate-200 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-red-600" : ""}`} />
          Refresh
        </Button>
      </header>

      <main className="px-6 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Latest News — Nepal</h2>
            <p className="mt-1 text-sm text-slate-500">
              Environment, Health, Politics, Tourism & more — updated in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold border capitalize ${CATEGORY_STYLES[cat] || CATEGORY_STYLES.other}`}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="h-48 w-full animate-pulse bg-slate-100" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50 p-14 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
            <h3 className="text-base font-bold text-red-700">Failed to Load News</h3>
            <p className="mt-1 max-w-sm text-xs text-red-500">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="mt-5 gap-2 border-red-200 font-semibold text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-14 text-center">
            <Newspaper className="mb-3 h-10 w-10 text-slate-300" />
            <h3 className="text-base font-bold text-slate-700">No News Available</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              There are no news articles matching the selected categories right now.
            </p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="mt-5 gap-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article, idx) => {
              const categories = (article.category || []).filter(
                (c) => c && CATEGORY_STYLES[c]
              );
              const primaryCategory = categories[0] || "other";
              const description = stripHtml(article.description);
              const contentPreview = stripHtml(article.content).slice(0, 120);
              const displayText =
                description.length > 0
                  ? description
                  : contentPreview || "No description available.";

              return (
                <Card
                  key={`${article.link}-${idx}`}
                  className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  {article.image_url && (
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border backdrop-blur-sm ${CATEGORY_STYLES[primaryCategory] || CATEGORY_STYLES.other}`}
                        >
                          <Tag className="h-3 w-3" />
                          {primaryCategory}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-2 text-base font-bold leading-snug text-slate-900 line-clamp-2 group-hover:text-red-700 transition-colors">
                      {article.title}
                    </h3>

                    <p className="mb-4 text-sm leading-relaxed text-slate-600 line-clamp-3">
                      {displayText}
                    </p>

                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {article.source_id || "Unknown Source"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(article.published_at)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((cat) => (
                          <span
                            key={cat}
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${CATEGORY_STYLES[cat] || CATEGORY_STYLES.other}`}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-600 hover:shadow-md active:scale-95"
                      >
                        See More
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
