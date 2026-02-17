import React from "react";
import type { RuntimeProps } from "@use-stall/types";
import { Button, cn, FancyButton, Input } from "@use-stall/ui";
import { StArrowBack, StReload } from "@use-stall/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetch_currency_news_service } from "@/services/currency-news.service";
import { get_error_message } from "@/utils";
import type { NewsItem } from "@/types/index";
import useRatesSelector from "@/store/rates-store";
import { toast } from "sonner";

const NewsPage = (_props: RuntimeProps) => {
  const navigate = useNavigate();
  const [search_params, setSearchParam] = useSearchParams();
  const base_currency = useRatesSelector.use.base_currency();
  const query_currency = React.useMemo(
    () => search_params.get("currency"),
    [search_params],
  );

  const [currency, set_currency] = React.useState<string>(
    (query_currency ?? base_currency).toUpperCase(),
  );
  const [items, set_items] = React.useState<NewsItem[] | null>(null);
  const [loading, set_loading] = React.useState<boolean>(false);

  const load_news = React.useCallback(async (next_currency: string) => {
    if (loading) return;

    set_loading(true);
    toast.promise(fetch_currency_news_service(next_currency), {
      loading: "Please wait...",
      success: (data) => {
        set_items(data);
        set_loading(false);
        setSearchParam(`currency=${next_currency}`);
        return "New refreshed";
      },
      error: (error: unknown) => {
        const message = get_error_message(error);
        set_loading(false);
        return message;
      },
    });
  }, []);

  const handle_refresh = React.useCallback(() => {
    void load_news(currency);
  }, [currency, load_news]);

  React.useEffect(() => {
    if (!items) {
      handle_refresh();
    }
  }, []);

  // JSX Code ===========
  return (
    <div className="h-full w-full overflow-y-auto p-5">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div
          className="w-full h-fit shrink-0 flex items-center justify-between gap-2 sticky
          -top-5 py-4 backdrop-blur-sm z-20"
        >
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="icon"
            className="text-xs size-10 shrink-0"
          >
            <StArrowBack />
          </Button>
          <FancyButton
            size="icon"
            onClick={handle_refresh}
            className="size-10 shrink-0"
          >
            <StReload className={cn("size-4", { "animate-spin": loading })} />
          </FancyButton>
        </div>

        <div>
          <h1 className="text-lg font-semibold">Currency News</h1>
          <p className="text-muted-foreground text-sm">
            Headlines and updates for the selected currency.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              value={currency}
              onChange={(event) =>
                set_currency(event.target.value.toUpperCase())
              }
              placeholder="USD"
            />
          </div>

          {items && !loading && items.length > 0 ? (
            <div className="grid gap-4">
              {items.map((item) => (
                <a
                  className="block rounded-lg bg-card border border-border p-5 hover:bg-muted/30 transition-colors"
                  href={item.link}
                  key={item.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {item.source} •{" "}
                    {new Date(item.published_at).toLocaleString("en-US")}
                  </p>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default React.memo(NewsPage);
