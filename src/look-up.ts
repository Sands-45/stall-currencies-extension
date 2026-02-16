import type { ExtensionLookupGroup } from "@use-stall/types";
import { fetch_usd_currency_rates_service } from "./services/currency-rates.service";
import { USD_RATES_ENDPOINT } from "./constants/default";

const extension_base_path = "/extensions/currencies";
const build_converter_path = (to_currency?: string): string => {
  const target_currency =
    typeof to_currency === "string" && to_currency.trim().length > 0
      ? to_currency.toUpperCase()
      : "USD";

  return `${extension_base_path}/converter?amount=1&from=USD&to=${target_currency}`;
};

export const LOOK_UP: ExtensionLookupGroup[] = [
  {
    id: "usd-rates",
    title: "Currencies",
    description: "Live exchange rates for all currencies against US Dollar",
    data_origin: "remote",
    source: USD_RATES_ENDPOINT,
    fetch: async ({ search_query }) => {
      const rates = await fetch_usd_currency_rates_service();
      const query = search_query.trim().toLowerCase();

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
        id: "convert-from-usd",
        label: "Convert from USD",
        close_on_complete: true,
        reopen_on_return: true,
        run: ({ item, helpers }) => {
          const to_currency =
            typeof item?.currency === "string" ? item.currency : undefined;
          helpers.navigate(build_converter_path(to_currency));
        },
      },
      {
        id: "open-converter",
        label: "Open Converter",
        close_on_complete: true,
        reopen_on_return: true,
        always_show: true,
        run: ({ helpers }) => {
          helpers.navigate(
            `${extension_base_path}/converter?amount=100&from=ZAR&to=USD`,
          );
        },
      },
    ],
  },
];
