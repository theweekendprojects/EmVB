import { afterEach, describe, expect, test } from "bun:test";
import * as React from "react";
import { act } from "react";
import { registerDaisyUIProvider } from "@perkyzz/emvb-daisyui";
import { componentProviders } from "@perkyzz/emvb-provider-api";
import { emptyDesign, type LayoutNode } from "../../../../core/index.ts";
import { ProviderNode } from "../../../../core/schema/layout.ts";
import type { Fetcher } from "../../../api.ts";
import { cleanup, mount } from "../../../../../test/dom/mount.ts";
import { ElementPanel } from "../ElementPanel.tsx";

registerDaisyUIProvider();

const stubFetcher: Fetcher = async () => new Response("{}", { status: 200 });

let nodes: LayoutNode[] = [];
afterEach(async () => {
  await cleanup();
  nodes = [];
});

function Harness({ start }: { start: LayoutNode }) {
  const [node, set] = React.useState(start);
  return (
    <ElementPanel
      node={node}
      layout={{
        schemaVersion: 18,
        root: { id: "root0001", type: "container", props: {}, children: [node] },
      }}
      design={emptyDesign()}
      rejection={null}
      fetcher={stubFetcher}
      device="desktop"
      onChange={(next) => {
        nodes.push(next);
        set(next);
      }}
      onDesignChange={async () => undefined}
      onSelect={() => undefined}
    />
  );
}

const countdown = () => {
  const provider = componentProviders().find((candidate) => candidate.id === "daisyui");
  return provider?.createNode("countdown", "cd000001") as unknown as LayoutNode;
};

async function type(field: string, text: string) {
  const input = document.querySelector<HTMLInputElement>(`[data-emvb-field="${field}"]`);
  if (!input) throw new Error(`No field ${field}`);
  await act(async () => {
    input.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.blur();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}

describe("a provider's number field saves a plain number", () => {
  test("typing a number keeps the page savable (it used to save { value, unit })", async () => {
    await mount(<Harness start={countdown()} />);
    await type("value", "50");
    const saved = nodes.at(-1);
    expect(saved?.props).toMatchObject({ value: 50 });
    expect(ProviderNode.safeParse(saved).success).toBe(true);
  });

  test("a date-time field is a real date picker and saves a plain string", async () => {
    await mount(<Harness start={countdown()} />);
    const input = document.querySelector<HTMLInputElement>('[data-emvb-field="target"]');
    expect(input?.type).toBe("datetime-local");
    await type("target", "2030-05-06T07:08");
    const saved = nodes.at(-1);
    expect(saved?.props).toMatchObject({ target: "2030-05-06T07:08" });
    expect(ProviderNode.safeParse(saved).success).toBe(true);
    await type("target", "");
    expect(nodes.at(-1)?.props).not.toHaveProperty("target");
    expect(ProviderNode.safeParse(nodes.at(-1)).success).toBe(true);
  });

  test("the Time zone, Show and Layout choices read as words, not codes", async () => {
    await mount(<Harness start={countdown()} />);
    const text = document.body.textContent ?? "";
    for (const label of ["Time zone", "Show", "Layout", "Ends at"]) expect(text).toContain(label);
  });

  test("the field has no pixel unit in its label", async () => {
    await mount(<Harness start={countdown()} />);
    const labels = [...document.querySelectorAll("label, span")].map((el) => el.textContent ?? "");
    expect(labels).toContain("Fixed number (only when no date is set)");
    expect(labels.filter((text) => text.includes("(px)"))).toEqual([]);
  });
});
