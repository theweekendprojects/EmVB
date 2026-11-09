import { DAISY_COMPONENT_CATALOG } from "./catalog/index.ts";
import { createDaisyUIProvider } from "./render/provider.ts";
import { componentProvider, registerComponentProvider } from "@perkyzz/emvb-provider-api";

/** Ready-to-register daisyUI provider. Importing this module registers the same singleton for compatibility. */
export const daisyUIProvider = createDaisyUIProvider(DAISY_COMPONENT_CATALOG);

export function registerDaisyUIProvider(): () => void {
  const active = componentProvider(daisyUIProvider.id);
  // Already registered (same singleton): nothing to do, and no new unregister handle.
  if (active && active.id === daisyUIProvider.id) return () => undefined;
  return registerComponentProvider(daisyUIProvider);
}

registerDaisyUIProvider();
