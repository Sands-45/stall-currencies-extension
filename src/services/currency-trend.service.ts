import { TREND_TTL, USD_TREND_ENDPOINT } from "@/constants/default";
import { useRatesStore } from "@/store/rates-store";
import type { CurrencyTrendDay, TrendApiResponse } from "@/types/index";

const TREND_POINTS = 7;
const TREND_LOOKBACK_DAYS = 14;

const to_iso_date = (value: Date): string => {
  return value.toISOString().slice(0, 10);
};

const to_utc_midnight = (value: Date): Date => {
  const next = new Date(value);
  next.setUTCHours(0, 0, 0, 0);
  return next;
};

const add_utc_days = (value: Date, amount: number): Date => {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
};

const resolve_rate_for_date = (
  currency: string,
  target_date: string,
  rates_by_date: Record<string, Record<string, number>>,
  sorted_dates: string[],
): number => {
  for (let index = sorted_dates.length - 1; index >= 0; index -= 1) {
    const date = sorted_dates[index];
    if (!date || date > target_date) {
      continue;
    }

    const rate = rates_by_date[date]?.[currency];
    if (typeof rate === "number" && Number.isFinite(rate)) {
      return rate;
    }
  }

  for (const date of sorted_dates) {
    const rate = rates_by_date[date]?.[currency];
    if (typeof rate === "number" && Number.isFinite(rate)) {
      return rate;
    }
  }

  throw new Error(`Trend data not available for ${currency}`);
};

export const fetch_currency_trend_service = async (
  from_currency: string,
  to_currency: string,
  base_currency = "USD",
  force_refresh = false,
): Promise<CurrencyTrendDay[]> => {
  const from = from_currency.toUpperCase();
  const to = to_currency.toUpperCase();
  const base = base_currency.toUpperCase();
  const cache_key = `${base}:${from}->${to}`;

  useRatesStore.getState().clear_expired_cache();

  const cached_item = useRatesStore.getState().trend_cache[cache_key];
  if (!force_refresh && cached_item && cached_item.expires_at > Date.now()) {
    return cached_item.data;
  }

  const today = to_utc_midnight(new Date());
  const start_date = add_utc_days(today, -TREND_LOOKBACK_DAYS);
  const end_date = today;

  const requested_symbols = Array.from(new Set([from, to])).filter(
    (currency) => currency !== base,
  );

  const query = new URLSearchParams({ from: base });
  if (requested_symbols.length > 0) {
    query.set("to", requested_symbols.join(","));
  }

  const endpoint = `${USD_TREND_ENDPOINT}/${to_iso_date(start_date)}..${to_iso_date(end_date)}?${query.toString()}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Trend request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Partial<TrendApiResponse>;
  const rates_by_date = payload.rates ?? {};
  const sorted_dates = Object.keys(rates_by_date).sort((a, b) =>
    a.localeCompare(b),
  );

  if (sorted_dates.length === 0) {
    throw new Error("Trend API returned no historical rate data");
  }

  const trend_days: CurrencyTrendDay[] = Array.from(
    { length: TREND_POINTS },
    (_, index) => {
      const date = add_utc_days(end_date, -(TREND_POINTS - 1 - index));
      const iso_date = to_iso_date(date);

      const from_rate =
        from === base
          ? 1
          : resolve_rate_for_date(from, iso_date, rates_by_date, sorted_dates);
      const to_rate =
        to === base
          ? 1
          : resolve_rate_for_date(to, iso_date, rates_by_date, sorted_dates);

      return {
        date: iso_date,
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
        from_rate,
        to_rate,
      };
    },
  );

  useRatesStore.getState().set_trend_cache(cache_key, trend_days, TREND_TTL);

  return trend_days;
};
