import { FLAG_COUNTRT_BY_CORRENCY, RATES_TTL, USD_RATES_ENDPOINT } from "@/constants/default";

export interface CurrencyRateItem {
  id: string;
  currency: string;
  currency_name: string;
  symbol: string;
  rate: number;
  flag: string;
  updated_at: string;
}

interface UsdRatesResponse {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
}

let rate_cache:
  | {
      expires_at: number;
      data: CurrencyRateItem[];
    }
  | undefined;

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
  return `https://flagcdn.com/w40/${country_code.toLowerCase()}.png`;
};

const normalize_rates = (
  payload: Partial<UsdRatesResponse>,
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

  const has_usd = items.some((item) => item.currency === "USD");
  if (!has_usd) {
    items.push({
      id: "USD",
      currency: "USD",
      currency_name: get_currency_name("USD"),
      symbol: "$",
      rate: 1,
      flag: get_currency_flag("USD"),
      updated_at,
    });
  }

  return items.sort((a, b) => a.currency.localeCompare(b.currency));
};

export const fetch_usd_currency_rates_service = async (
  force_refresh = false,
): Promise<CurrencyRateItem[]> => {
  const now = Date.now();
  if (
    !force_refresh &&
    rate_cache &&
    rate_cache.data.length > 0 &&
    rate_cache.expires_at > now
  ) {
    return rate_cache.data;
  }

  const response = await fetch(USD_RATES_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Rates request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Partial<UsdRatesResponse>;
  if (payload.result && payload.result !== "success") {
    throw new Error("Rates API returned a non-success response");
  }

  const data = normalize_rates(payload);
  rate_cache = {
    data,
    expires_at: now + RATES_TTL,
  };

  return data;
};
