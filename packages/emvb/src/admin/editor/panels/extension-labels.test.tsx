import { afterEach, describe, expect, test } from "bun:test";
import type { ExtensionManifest, Layout } from "../../../core/index.ts";
import {
  adminExtensionGroupTitle,
  extensionLabelsOf,
  setAdminExtensionManifests,
} from "../extension-manifests.ts";
import { LayersPanel } from "./LayersPanel.tsx";
import { cleanup, mount as mountTree } from "../../../../test/dom/mount.ts";

const manifest: ExtensionManifest = {
  extensionApi: 1,
  id: "daisyui",
  label: "daisyUI",
  panels: [],
  sources: [],
  elements: [
    {
      type: "ext:daisyui/daisy-card",
      name: "daisy-card",
      label: "Card",
      group: "layout",
      schema: { type: "object", properties: {} },
      fields: [],
      defaults: {},
    },
  ],
};

const layout = {
  schemaVersion: 18,
  root: {
    id: "root0001",
    type: "container",
    props: {},
    children: [{ id: "card0001", type: "ext:daisyui/daisy-card", props: {}, children: [] }],
  },
} as unknown as Layout;

afterEach(async () => {
  await cleanup();
  setAdminExtensionManifests([]);
});

describe("extension elements are named by their label (W-927)", () => {
  test("a Layers row for an extension element shows its label, not its stored type", async () => {
    await mountTree(
      <LayersPanel
        layout={layout}
        selectedId={null}
        extensionNames={extensionLabelsOf([manifest])}
        onSelect={() => {}}
        onDuplicate={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        onDelete={() => {}}
      />,
    );
    const row = document.querySelector('[data-emvb-layer="card0001"]');
    expect(row?.textContent).toContain("Card");
    expect(row?.textContent).not.toContain("ext:daisyui");
  });

  test("the labels map each stored type to its element label", () => {
    expect(extensionLabelsOf([manifest])).toEqual({ "ext:daisyui/daisy-card": "Card" });
    expect(extensionLabelsOf([])).toEqual({});
  });

  test("the Add panel heading is the extension's name", () => {
    setAdminExtensionManifests([manifest]);
    expect(adminExtensionGroupTitle()).toBe("daisyUI");
  });

  test("two extensions fall back to a generic heading", () => {
    setAdminExtensionManifests([manifest, { ...manifest, id: "other", label: "Other" }]);
    expect(adminExtensionGroupTitle()).toBe("Extensions");
  });
});
