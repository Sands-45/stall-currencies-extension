import {
  BASE_RATES_ENDPOINT,
  FLAG_COUNTRT_BY_CORRENCY,
  RATES_TTL,
} from "@/constants/default";
import flags from "@/assets/flags.json";
import { useRatesStore } from "@/store/rates-store";
import type { CurrencyRateItem, UsdRatesResponse } from "@/types/index";

const get_currency_name = (currency: string): string => {
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "currency" }).of(currency) ??
      currency
    );
  } catch {
    return currency;
  }
};

const get_currency_symbol = (currency: string): string => {
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);

    return parts.find((part) => part.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
};

const get_currency_flag = (currency: string): string => {
  const country_code = FLAG_COUNTRT_BY_CORRENCY[currency] ?? "US";
  const flag = flags.find((f) => f.code === country_code.toLowerCase());
  return (
    flag?.flag ?? `https://flagcdn.com/w40/${country_code.toLowerCase()}.png`
  );
};

const normalize_rates = (
  payload: Partial<UsdRatesResponse>,
  base_currency: string,
): CurrencyRateItem[] => {
  const rates_record = payload.rates ?? {};
  const updated_at = payload.time_last_update_utc ?? new Date().toISOString();

  const items: CurrencyRateItem[] = Object.entries(rates_record).map(
    ([currency_code, rate]) => {
      const currency = currency_code.toUpperCase();
      return {
        id: currency,
        currency,
        currency_name: get_currency_name(currency),
        symbol: get_currency_symbol(currency),
        rate,
        flag: get_currency_flag(currency),
        updated_at,
      };
    },
  );

  const normalized_base = base_currency.toUpperCase();
  const has_base = items.some((item) => item.currency === normalized_base);
  if (!has_base) {
    items.push({
      id: normalized_base,
      currency: normalized_base,
      currency_name: get_currency_name(normalized_base),
      symbol: get_currency_symbol(normalized_base),
      rate: 1,
      flag: get_currency_flag(normalized_base),
      updated_at,
    });
  }

  return items.sort((a, b) => a.currency.localeCompare(b.currency));
};

export const fetch_currency_rates_service = async (
  base_currency = "USD",
  force_refresh = false,
): Promise<CurrencyRateItem[]> => {
  const normalized_base = base_currency.toUpperCase();

  useRatesStore.getState().clear_expired_cache();

  const cache_entry = useRatesStore.getState().rates_cache[normalized_base];
  if (!force_refresh && cache_entry && cache_entry.expires_at > Date.now()) {
    return cache_entry.data;
  }

  const response = await fetch(`${BASE_RATES_ENDPOINT}/${normalized_base}`);
  if (!response.ok) {
    throw new Error(`Rates request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Partial<UsdRatesResponse>;
  if (payload.result && payload.result !== "success") {
    throw new Error("Rates API returned a non-success response");
  }

  const data = normalize_rates(payload, normalized_base);
  useRatesStore.getState().set_rates_cache(normalized_base, data, RATES_TTL);

  return data;
};

export const fetch_usd_currency_rates_service = async (
  force_refresh = false,
): Promise<CurrencyRateItem[]> => {
  return fetch_currency_rates_service("USD", force_refresh);
};
