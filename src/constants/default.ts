export const USD_RATES_ENDPOINT = "https://open.er-api.com/v6/latest/USD";
export const USD_TREND_ENDPOINT = "https://api.frankfurter.app";

export const RATES_TTL = 60_000;
export const TREND_TTL = 10 * 60_000;

export const FLAG_COUNTRT_BY_CORRENCY: Record<string, string> = {
  AED: "AE",
  AUD: "AU",
  BRL: "BR",
  CAD: "CA",
  CHF: "CH",
  CNY: "CN",
  DKK: "DK",
  EUR: "EU",
  GBP: "GB",
  HKD: "HK",
  INR: "IN",
  JPY: "JP",
  KRW: "KR",
  MXN: "MX",
  NOK: "NO",
  NZD: "NZ",
  SEK: "SE",
  SGD: "SG",
  TRY: "TR",
  USD: "US",
  ZAR: "ZA",
};
