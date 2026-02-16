import React from "react";
import type { RuntimeProps } from "@use-stall/types";
import { Badge, Button, Card, Input } from "@use-stall/ui";
import { StArrowBack } from "@use-stall/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  build_rate_map,
  convert_currency,
  format_output_amount,
  get_error_message,
  parse_conversion_query,
} from "../../utils";
import {
  fetch_usd_currency_rates_service,
  type CurrencyRateItem,
} from "../../services/currency-rates.service";

const get_default_query = (search_params: URLSearchParams): string => {
  const amount_value = search_params.get("amount") ?? "200";
  const from_value = (search_params.get("from") ?? "ZAR").toUpperCase();
  const to_value = (search_params.get("to") ?? "USD").toUpperCase();
  return `${amount_value} ${from_value} in ${to_value}`;
};

const get_relative_time_label = (
  updated_at: string | null,
  tick: number,
): string => {
  if (!updated_at) return "Updated recently";

  const updated_ms = new Date(updated_at).getTime();
  if (Number.isNaN(updated_ms)) return "Updated recently";

  const diff_seconds = Math.max(0, Math.floor((tick - updated_ms) / 1000));

  if (diff_seconds < 60) {
    const suffix = diff_seconds === 1 ? "" : "s";
    return `Updated ${diff_seconds} second${suffix} ago`;
  }

  const diff_minutes = Math.floor(diff_seconds / 60);
  if (diff_minutes < 60) {
    const suffix = diff_minutes === 1 ? "" : "s";
    return `Updated ${diff_minutes} minute${suffix} ago`;
  }

  const diff_hours = Math.floor(diff_minutes / 60);
  const suffix = diff_hours === 1 ? "" : "s";
  return `Updated ${diff_hours} hour${suffix} ago`;
};

const ConverterPage = (_props: RuntimeProps) => {
  const [search_params] = useSearchParams();
  const navigate = useNavigate();
  const [query_input, set_query_input] = React.useState<string>(() =>
    get_default_query(search_params),
  );
  const [rate_items, set_rate_items] = React.useState<CurrencyRateItem[]>([]);
  const [loading, set_loading] = React.useState<boolean>(true);
  const [error_message, set_error_message] = React.useState<string | null>(
    null,
  );
  const [tick, set_tick] = React.useState<number>(Date.now());

  React.useEffect(() => {
    let is_active = true;

    const load_rates = async () => {
      set_loading(true);
      set_error_message(null);

      try {
        const data = await fetch_usd_currency_rates_service();
        if (!is_active) return;
        set_rate_items(data);
      } catch (error: unknown) {
        if (!is_active) return;
        set_error_message(get_error_message(error));
      } finally {
        if (!is_active) return;
        set_loading(false);
      }
    };

    void load_rates();

    return () => {
      is_active = false;
    };
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => set_tick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const parsed_query = React.useMemo(
    () => parse_conversion_query(query_input),
    [query_input],
  );

  const rates_by_currency = React.useMemo(
    () => build_rate_map(rate_items),
    [rate_items],
  );

  const from_currency = parsed_query?.from_currency ?? "USD";
  const to_currency = parsed_query?.to_currency ?? "USD";
  const input_amount = parsed_query?.amount ?? 0;

  const from_currency_item = React.useMemo(
    () => rate_items.find((item) => item.currency === from_currency),
    [rate_items, from_currency],
  );

  const to_currency_item = React.useMemo(
    () => rate_items.find((item) => item.currency === to_currency),
    [rate_items, to_currency],
  );

  const rates_are_ready =
    rates_by_currency[from_currency] !== undefined &&
    rates_by_currency[to_currency] !== undefined;

  const converted_amount = React.useMemo(() => {
    if (!parsed_query || !rates_are_ready) return null;
    return convert_currency(
      parsed_query.amount,
      parsed_query.from_currency,
      parsed_query.to_currency,
      rates_by_currency,
    );
  }, [parsed_query, rates_are_ready, rates_by_currency]);

  const update_label = React.useMemo(() => {
    const updated_at = rate_items[0]?.updated_at ?? null;
    return get_relative_time_label(updated_at, tick);
  }, [rate_items, tick]);

  const formatted_result = React.useMemo(() => {
    if (converted_amount === null) return "--";
    return format_output_amount(converted_amount, to_currency);
  }, [converted_amount, to_currency]);

  const is_query_valid = parsed_query !== null;

  return (
    <div className="h-full w-full overflow-y-auto p-5">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div
          className="w-full h-fit shrink-0 flex items-center justify-between gap-2 sticky -top-5
               py-4 backdrop-blur-sm z-20"
        >
          <Button
            disabled={loading}
            onClick={() => navigate(-1)}
            variant={"outline"}
            size={"icon"}
            className="text-xs size-10 shrink-0"
          >
            <StArrowBack />
          </Button>
        </div>

        <div className="mt-4">
          <h1 className="text-lg font-semibold">Currency Conveter</h1>
          <p className="text-muted-foreground text-sm">
            Type a query like{" "}
            <span className="font-medium">200 ZAR in USD</span>
          </p>
          {!is_query_valid && (
            <p className="mt-2 text-xs text-muted-foreground">
              Invalid format. Use: {"<amount> <from> in <to>"} (e.g. 200 ZAR in
              USD)
            </p>
          )}
        </div>

        <Input
          value={query_input}
          onChange={(event) => set_query_input(event.target.value)}
          placeholder="200 ZAR in USD"
        />

        <Card className="p-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading live exchange rates...
            </p>
          ) : null}

          {!loading && error_message ? (
            <p className="text-sm text-destructive">
              Failed to load exchange rates: {error_message}
            </p>
          ) : null}

          {!loading && !error_message ? (
            <>
              <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
                <div className="flex flex-col items-center justify-center gap-1">
                  <h2 className="text-xl font-semibold">
                    {input_amount} {from_currency.toLowerCase()} in{" "}
                    {to_currency.toLowerCase()}
                  </h2>
                  <Badge
                    variant="outline"
                    className="mt-2 px-2 py-1 rounded-md bg-main-background"
                  >
                    {from_currency_item?.currency_name ?? from_currency}
                  </Badge>
                </div>

                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-2xl">→</span>
                  <span className="text-xs text-muted-foreground">
                    {update_label}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1">
                  <h2 className="text-xl font-semibold">{formatted_result}</h2>
                  <Badge
                    variant="outline"
                    className="mt-2 px-2 py-1 rounded-md bg-main-background"
                  >
                    {to_currency_item?.currency_name ?? to_currency}
                  </Badge>
                </div>
              </div>

              {!rates_are_ready && is_query_valid ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  Unsupported currency code. Use ISO 4217 codes, for example:
                  USD, EUR, ZAR.
                </p>
              ) : null}
            </>
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default React.memo(ConverterPage);
