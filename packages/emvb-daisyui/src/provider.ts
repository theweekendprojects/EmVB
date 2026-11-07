import { DAISY_COMPONENT_CATALOG } from "./catalog/index.ts";
import { createDaisyUIProvider } from "./render/provider.ts";

/** Ready-to-register provider containing the WP4 daisyUI catalog. */
export const daisyUIProvider = createDaisyUIProvider(DAISY_COMPONENT_CATALOG);
