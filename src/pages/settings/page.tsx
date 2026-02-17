import React from "react";
import type { RuntimeProps } from "@use-stall/types";
import { Badge, Button, Card, FancyButton, Input } from "@use-stall/ui";
import { StArrowBack } from "@use-stall/icons";
import { useNavigate } from "react-router-dom";
import { FLAG_COUNTRT_BY_CORRENCY } from "@/constants/default";
import useRatesSelector from "@/store/rates-store";
import { toast } from "sonner";

const ALL_CURRENCIES = Object.keys(FLAG_COUNTRT_BY_CORRENCY).sort((a, b) =>
  a.localeCompare(b),
);

const SettingsPage = (_props: RuntimeProps) => {
  const navigate = useNavigate();
  const base_currency = useRatesSelector.use.base_currency();
  const set_base_currency = useRatesSelector.use.set_base_currency();

  const [input_value, set_input_value] = React.useState(base_currency);

  React.useEffect(() => {
    set_input_value(base_currency);
  }, [base_currency]);

  const handle_save = React.useCallback(() => {
    const normalized = input_value.trim().toUpperCase();

    if (!normalized) {
      toast.warning("Please enter a currency code.");
      return;
    }

    if (!ALL_CURRENCIES.includes(normalized)) {
      toast.warning(
        "Unsupported currency code. Use a valid ISO code like USD, EUR, ZAR.",
      );
      return;
    }

    set_base_currency(normalized);
  }, [input_value, set_base_currency]);

  return (
    <div className="h-full w-full overflow-y-auto p-5">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div
          className="w-full h-fit shrink-0 flex items-center justify-between gap-2
          sticky -top-5 py-4 backdrop-blur-sm z-20"
        >
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="icon"
            className="text-xs size-10 shrink-0"
          >
            <StArrowBack />
          </Button>
        </div>

        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Configure default currency preferences for this extension.
          </p>
        </div>

        <Card className="p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-lg font-medium">Base currency</p>
            <p className="text-sm text-muted-foreground">
              Rates and trends are fetched using this base. Cache TTL is 1 hour.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Input
              list="currency-options"
              value={input_value}
              onChange={(event) => set_input_value(event.target.value)}
              placeholder="USD"
              className="bg-main-background"
            />
            <datalist id="currency-options">
              {ALL_CURRENCIES.map((currency) => (
                <option key={currency} value={currency} />
              ))}
            </datalist>

            <div className="mt-4 flex items-center gap-2">
              <FancyButton onClick={handle_save}>Save Changes</FancyButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default React.memo(SettingsPage);
