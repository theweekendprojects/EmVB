import { Select } from "@cloudflare/kumo";
import type { LayoutNode, ProviderNode } from "../../../../core/index.ts";
import { FIELD } from "../../../ui.ts";

const THEMES = ["", "light", "dark", "corporate", "business", "cupcake"] as const;

export function ProviderMetaFields({ node, onChange }: { node: LayoutNode; onChange: (node: LayoutNode) => void }) {
  // UnknownNode also has a string `type`, so `type !== "provider"` does not narrow the union on its
  // own; assert ProviderNode after the runtime check so `provider`/`providerMeta` are typed.
  if (node.type !== "provider") return null;
  const providerNode = node as ProviderNode;
  if (providerNode.provider !== "daisyui") return null;
  const current = typeof providerNode.providerMeta?.theme === "string" ? providerNode.providerMeta.theme : "";
  return (
    <div data-emvb-provider-meta="theme">
      <Select
        label="Theme"
        className={FIELD}
        value={current}
        onValueChange={(theme) => {
          const providerMeta = { ...(providerNode.providerMeta ?? {}) };
          if (theme) providerMeta.theme = theme;
          else delete providerMeta.theme;
          onChange({ ...providerNode, providerMeta: Object.keys(providerMeta).length ? providerMeta : undefined });
        }}
      >
        {THEMES.map((theme) => (
          <Select.Option key={theme || "inherit"} value={theme}>
            {theme ? `${theme[0]?.toUpperCase() ?? ""}${theme.slice(1)}` : "Inherit page theme"}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
}
