import { CURRENCY_NEWS_RSS_ENDPOINT, NEWS_TTL } from "@/constants/default";
import { useRatesStore } from "@/store/rates-store";
import type { NewsItem } from "@/types/index";

interface Rss2JsonItem {
  title?: string;
  pubDate?: string;
  link?: string;
  description?: string;
  author?: string;
}

interface Rss2JsonResponse {
  items?: Rss2JsonItem[];
}

const build_news_query_url = (currency: string): string => {
  const query = `${currency} currency exchange rate`;
  const rss_url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  return `${CURRENCY_NEWS_RSS_ENDPOINT}?rss_url=${encodeURIComponent(rss_url)}`;
};

const strip_html = (value: string): string => {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalize_news = (
  items: Rss2JsonItem[],
  currency: string,
): NewsItem[] => {
  return items
    .filter(
      (item) => typeof item.title === "string" && typeof item.link === "string",
    )
    .slice(0, 12)
    .map((item, index) => ({
      id: `${currency}-${item.link ?? index}`,
      title: item.title ?? "Untitled",
      link: item.link ?? "",
      source: item.author?.trim() || "Google News",
      published_at: item.pubDate ?? new Date().toISOString(),
      description: strip_html(item.description ?? "Currency market update"),
      currency,
    }));
};

export const fetch_currency_news_service = async (
  currency: string,
  force_refresh = false,
): Promise<NewsItem[]> => {
  const normalized_currency = currency.trim().toUpperCase() || "USD";
  const cache_key = normalized_currency;

  useRatesStore.getState().clear_expired_cache();

  const cached_item = useRatesStore.getState().news_cache[cache_key];
  if (!force_refresh && cached_item && cached_item.expires_at > Date.now()) {
    return cached_item.data;
  }

  const response = await fetch(build_news_query_url(normalized_currency));
  if (!response.ok) {
    throw new Error(`News request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Partial<Rss2JsonResponse>;
  const items = normalize_news(payload.items ?? [], normalized_currency);

  // sort by date
  items.sort((a, b) => b.published_at.localeCompare(a.published_at));

  useRatesStore.getState().set_news_cache(cache_key, items, NEWS_TTL);

  return items;
};
