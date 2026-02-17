import React from "react";
import type { RuntimeProps } from "@use-stall/types";
import { Badge, Button, Card, Input } from "@use-stall/ui";
import { StArrowBack, StArrowRightLong } from "@use-stall/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import LineChart, {
  type CurrencyTrendPoint,
} from "../../components/line-chart";
import {
  build_rate_map,
  convert_currency,
  format_output_amount,
  get_error_message,
  parse_conversion_query,
} from "../../utils";
import {
  fetch_currency_rates_service,
} from "../../services/currency-rates.service";
import { fetch_currency_trend_service } from "../../services/currency-trend.service";
import useRatesSelector from "../../store/rates-store";
import { get_default_query, get_relative_time_label } from "./page.helpers";
import { CenteredCardMessage, ConverterIntroSection } from "./page.sections";
import type { CurrencyRateItem } from "../../types";

const ConverterPage = (_props: RuntimeProps) => {
  const [search_params] = useSearchParams();
  const navigate = useNavigate();
  const base_currency = useRatesSelector.use.base_currency();
  const [query_input, set_query_input] = React.useState<string>(() =>
    get_default_query(search_params, base_currency),
  );
  const [rate_items, set_rate_items] = React.useState<CurrencyRateItem[]>([]);
  const [loading, set_loading] = React.useState<boolean>(true);
  const [error_message, set_error_message] = React.useState<string | null>(
    null,
  );
  const [trend_points, set_trend_points] = React.useState<CurrencyTrendPoint[]>(
    [],
  );
  const [trend_loading, set_trend_loading] = React.useState<boolean>(false);
  const [trend_error_message, set_trend_error_message] = React.useState<
    string | null
  >(null);
  const [tick, set_tick] = React.useState<number>(Date.now());

  React.useEffect(() => {
    set_query_input(get_default_query(search_params, base_currency));
  }, [search_params, base_currency]);

  React.useEffect(() => {
    let is_active = true;

    const load_rates = async () => {
      set_loading(true);
      set_error_message(null);

      try {
        const data = await fetch_currency_rates_service(base_currency);
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
  }, [base_currency]);

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

  const from_currency = parsed_query?.from_currency ?? base_currency;
  const to_currency = parsed_query?.to_currency ?? (base_currency === "USD" ? "EUR" : "USD");
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
  const weekly_trend_points = trend_points;
  const can_show_trend_state = !loading && !error_message && rates_are_ready;

  React.useEffect(() => {
    let is_active = true;

    if (!rates_are_ready) {
      set_trend_points([]);
      set_trend_error_message(null);
      set_trend_loading(false);
      return () => {
        is_active = false;
      };
    }

    const load_trend = async () => {
      set_trend_loading(true);
      set_trend_error_message(null);

      try {
        const data = await fetch_currency_trend_service(
          from_currency,
          to_currency,
          base_currency,
        );
        if (!is_active) return;

        const normalized: CurrencyTrendPoint[] = data.map((item) => ({
          label: item.label,
          fromRate: item.from_rate,
          toRate: item.to_rate,
        }));
        set_trend_points(normalized);
      } catch (error: unknown) {
        if (!is_active) return;
        set_trend_points([]);
        set_trend_error_message(get_error_message(error));
      } finally {
        if (!is_active) return;
        set_trend_loading(false);
      }
    };

    void load_trend();

    return () => {
      is_active = false;
    };
  }, [rates_are_ready, from_currency, to_currency, base_currency]);

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

        <ConverterIntroSection is_query_valid={is_query_valid} />

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
            <React.Fragment>
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
                  <StArrowRightLong className="size-4 text-foreground" />
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
            </React.Fragment>
          ) : null}
        </Card>

        <Card className="p-5 grid">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Last 7 days trend</h2>
            <p className="text-xs text-muted-foreground">
              {from_currency} and {to_currency} movement relative to {base_currency}.
            </p>
          </div>

          {can_show_trend_state && !trend_loading && !trend_error_message ? (
            <LineChart
              data={weekly_trend_points}
              fromCurrency={from_currency}
              toCurrency={to_currency}
            />
          ) : null}

          {can_show_trend_state && trend_loading ? (
            <CenteredCardMessage>Loading trend data...</CenteredCardMessage>
          ) : null}

          {can_show_trend_state && trend_error_message ? (
            <CenteredCardMessage tone="destructive">
              Failed to load trend data: {trend_error_message}
            </CenteredCardMessage>
          ) : null}

          {can_show_trend_state &&
          !trend_loading &&
          !trend_error_message &&
          weekly_trend_points.length === 0 ? (
            <CenteredCardMessage>
              No trend data available for the selected currency pair.
            </CenteredCardMessage>
          ) : null}

          {!can_show_trend_state ? (
            <CenteredCardMessage>
              Trend chart will appear once rates are available.
            </CenteredCardMessage>
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default React.memo(ConverterPage);
