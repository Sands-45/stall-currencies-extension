import type { StallExtension } from "@use-stall/types";
import { LOOK_UP } from "./look-up";

const app: StallExtension = {
  pages: [
    {
      index: false,
      id: "converter",
      title: "Currency Converter",
      description: "Convert one currency into another using live USD rates",
      ui: "currency_converter",
    },
  ],
  lookup: LOOK_UP,
};

export default app;
