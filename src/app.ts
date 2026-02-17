import type { StallExtension } from "@use-stall/types";
import { LOOK_UP } from "./look-up";

const app: StallExtension = {
  pages: [
    {
      index: false,
      id: "converter",
      title: "Currency Converter",
      description: "Convert one currency into another using live exchange rates",
      ui: "currency_converter",
    },
    {
      index: false,
      id: "news",
      title: "Currency News",
      description: "Latest currency-related headlines and market updates",
      ui: "currency_news",
    },
    {
      index: false,
      id: "settings",
      title: "Settings",
      description: "Configure base currency and cache behavior",
      ui: "currency_settings",
    },
  ],
  lookup: LOOK_UP,
};

export default app;
