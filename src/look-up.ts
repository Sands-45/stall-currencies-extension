import type { ExtensionLookupGroup } from "@use-stall/types";
import { fetch_currency_rates_service } from "./services/currency-rates.service";
import { USD_RATES_ENDPOINT } from "./constants/default";
import { useRatesStore } from "./store/rates-store";

const extension_base_path = "/extensions/currencies";

const build_converter_path = (base_currency: string, to_currency?: string): string => {
  const normalized_base = base_currency.toUpperCase();
  const target_currency =
    typeof to_currency === "string" && to_currency.trim().length > 0
      ? to_currency.toUpperCase()
      : "USD";

  return `${extension_base_path}/converter?amount=1&from=${normalized_base}&to=${target_currency}`;
};

const build_news_path = (currency?: string): string => {
  const target_currency =
    typeof currency === "string" && currency.trim().length > 0
      ? currency.toUpperCase()
      : useRatesStore.getState().base_currency;

  return `${extension_base_path}/news?currency=${target_currency}`;
};

export const LOOK_UP: ExtensionLookupGroup[] = [
  {
    id: "usd-rates",
    title: "Currencies",
    description: "Live exchange rates for all currencies against selected base",
    data_origin: "remote",
    source: USD_RATES_ENDPOINT,
    fetch: async ({ search_query }) => {
      const base_currency = useRatesStore.getState().base_currency;
      const rates = await fetch_currency_rates_service(base_currency);
      const query = (search_query ?? "").trim().toLowerCase();

      if (!query) return rates;

      return rates.filter((item) => {
        const currency = item.currency.toLowerCase();
        const currency_name = item.currency_name.toLowerCase();
        const symbol = item.symbol.toLowerCase();

        return (
          currency.includes(query) ||
          currency_name.includes(query) ||
          symbol.includes(query)
        );
      });
    },
    filters: [],
    sorting: {
      key: "currency",
      order: "asc",
    },
    keys: {
      id: "id",
      image: "flag",
      fallback: "./assets/icon.png",
      title: {
        value: "{{currency}}",
        format: "string",
        className: "uppercase",
      },
      description: {
        value: "{{currency_name}}",
        format: "string",
      },
      right: {
        value: "{{symbol}} {{rate}}",
        format: "none",
      },
    },
    actions: [
      {
        id: "convert-from-base",
        label: "Convert",
        close_on_complete: true,
        reopen_on_return: true,
        run: ({ item, helpers }) => {
          const to_currency =
            typeof item?.currency === "string" ? item.currency : undefined;
          const base_currency = useRatesStore.getState().base_currency;
          helpers.navigate(build_converter_path(base_currency, to_currency));
        },
      },
      {
        id: "news-for-currency",
        label: "Currency News",
        close_on_complete: true,
        reopen_on_return: true,
        run: ({ item, helpers }) => {
          const currency =
            typeof item?.currency === "string" ? item.currency : undefined;
          helpers.navigate(build_news_path(currency));
        },
      },
      {
        id: "open-converter",
        label: "Open Converter",
        close_on_complete: true,
        reopen_on_return: true,
        always_show: true,
        run: ({ helpers }) => {
          const base_currency = useRatesStore.getState().base_currency;
          const fallback_to = base_currency === "USD" ? "EUR" : "USD";
          helpers.navigate(
            `${extension_base_path}/converter?amount=100&from=${base_currency}&to=${fallback_to}`,
          );
        },
      },
      {
        id: "open-settings",
        label: "Settings",
        close_on_complete: true,
        reopen_on_return: true,
        always_show: true,
        run: ({ helpers }) => {
          helpers.navigate(`${extension_base_path}/settings`);
        },
      },
    ],
  },
];
