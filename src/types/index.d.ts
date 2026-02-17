export interface CurrencyTrendDay {
  date: string;
  label: string;
  from_rate: number;
  to_rate: number;
}

export interface TrendApiResponse {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

export interface CurrencyRateItem {
  id: string;
  currency: string;
  currency_name: string;
  symbol: string;
  rate: number;
  flag: string;
  updated_at: string;
}

export interface UsdRatesResponse {
  result?: string;
  base_code?: string;
  time_last_update_utc?: string;
  amount?: number;
  base?: string;
  date?: string;
  rates: Record<string, number>;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  published_at: string;
  description: string;
  currency: string;
}
