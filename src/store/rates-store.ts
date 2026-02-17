import { createSelectors, normalize_currency_code } from "@/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrencyRateItem, CurrencyTrendDay, NewsItem } from "@/types/index";

interface CachedRatesEntry {
  base_currency: string;
  data: CurrencyRateItem[];
  expires_at: number;
}

interface CachedTrendEntry {
  key: string;
  data: CurrencyTrendDay[];
  expires_at: number;
}

interface CachedNewsEntry {
  key: string;
  data: NewsItem[];
  expires_at: number;
}

interface RatesState {
  base_currency: string;
  rates_cache: Record<string, CachedRatesEntry>;
  trend_cache: Record<string, CachedTrendEntry>;
  news_cache: Record<string, CachedNewsEntry>;
  set_base_currency: (currency: string) => void;
  set_rates_cache: (
    base_currency: string,
    data: CurrencyRateItem[],
    ttl_ms: number,
  ) => void;
  set_trend_cache: (key: string, data: CurrencyTrendDay[], ttl_ms: number) => void;
  set_news_cache: (key: string, data: NewsItem[], ttl_ms: number) => void;
  clear_expired_cache: () => void;
}

export const useRatesStore = create<RatesState>()(
  persist(
    (set) => ({
      base_currency: "USD",
      rates_cache: {},
      trend_cache: {},
      news_cache: {},
      set_base_currency: (currency) => {
        const next = normalize_currency_code(currency);
        if (!next) return;
        set((state) => ({ ...state, base_currency: next }));
      },
      set_rates_cache: (base_currency, data, ttl_ms) => {
        const key = base_currency.toUpperCase();
        set((state) => ({
          ...state,
          rates_cache: {
            ...state.rates_cache,
            [key]: {
              base_currency: key,
              data,
              expires_at: Date.now() + ttl_ms,
            },
          },
        }));
      },
      set_trend_cache: (key, data, ttl_ms) => {
        set((state) => ({
          ...state,
          trend_cache: {
            ...state.trend_cache,
            [key]: {
              key,
              data,
              expires_at: Date.now() + ttl_ms,
            },
          },
        }));
      },
      set_news_cache: (key, data, ttl_ms) => {
        set((state) => ({
          ...state,
          news_cache: {
            ...state.news_cache,
            [key]: {
              key,
              data,
              expires_at: Date.now() + ttl_ms,
            },
          },
        }));
      },
      clear_expired_cache: () => {
        const now = Date.now();
        set((state) => {
          const rates_cache = Object.fromEntries(
            Object.entries(state.rates_cache).filter(([, entry]) =>
              entry.expires_at > now,
            ),
          );
          const trend_cache = Object.fromEntries(
            Object.entries(state.trend_cache).filter(([, entry]) =>
              entry.expires_at > now,
            ),
          );
          const news_cache = Object.fromEntries(
            Object.entries(state.news_cache).filter(([, entry]) =>
              entry.expires_at > now,
            ),
          );

          return {
            ...state,
            rates_cache,
            trend_cache,
            news_cache,
          };
        });
      },
    }),
    {
      name: "currencies-store",
    },
  ),
);

const useRatesSelector = createSelectors(useRatesStore);

export default useRatesSelector;
