import type { CurrencyRateItem } from "./services/currency-rates.service";

interface ConversionQuery {
  amount: number;
  from_currency: string;
  to_currency: string;
}

export const build_rate_map = (
  items: CurrencyRateItem[],
): Record<string, number> => {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.currency] = item.rate;
    return acc;
  }, {});
};

export const convert_currency = (
  amount: number,
  from_currency: string,
  to_currency: string,
  rates_by_currency: Record<string, number>,
): number => {
  const from_rate = rates_by_currency[from_currency];
  const to_rate = rates_by_currency[to_currency];

  if (from_rate === undefined || to_rate === undefined || from_rate === 0) {
    throw new Error("Missing rate information for the selected currencies");
  }

  const amount_in_usd = amount / from_rate;
  return amount_in_usd * to_rate;
};

export const parse_conversion_query = (value: string): ConversionQuery | null => {
  const clean_value = value.trim().replace(/\s+/g, " ");
  if (!clean_value) return null;

  const pattern = /^([0-9]*\.?[0-9]+)\s+([a-z]{3})\s+(?:in|to)\s+([a-z]{3})$/i;
  const match = clean_value.match(pattern);

  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return null;

  return {
    amount,
    from_currency: match[2].toUpperCase(),
    to_currency: match[3].toUpperCase(),
  };
};

export const format_output_amount = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

export const get_error_message = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unknown error";
};
