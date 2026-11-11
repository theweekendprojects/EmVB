import { Select } from "@cloudflare/kumo";
import type { LayoutNode } from "../../../../core/index.ts";
import { FIELD } from "../../../ui.ts";

const THEMES = ["", "light", "dark", "corporate", "business", "cupcake"] as const;

export function ProviderMetaFields({ node, onChange }: { node: LayoutNode; onChange: (node: LayoutNode) => void }) {
  if (node.type !== "provider" || node.provider !== "daisyui") return null;
  const current = typeof node.providerMeta?.theme === "string" ? node.providerMeta.theme : "";
  return (
    <div data-emvb-provider-meta="theme">
      <Select
        label="Theme"
        className={FIELD}
        value={current}
        onValueChange={(theme) => {
          const providerMeta = { ...(node.providerMeta ?? {}) };
          if (theme) providerMeta.theme = theme;
          else delete providerMeta.theme;
          onChange({ ...node, providerMeta: Object.keys(providerMeta).length ? providerMeta : undefined });
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
