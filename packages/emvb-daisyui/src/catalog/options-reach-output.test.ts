import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";
import { daisyUIProvider } from "../provider.ts";
import { DAISY_COMPONENT_CATALOG } from "./index.ts";

// Every option a field offers must put its classes in the rendered markup. Without this a typo in a
// classMap, or a field that nothing reads, would pass the other checks and do nothing on the page.

type Fields = readonly {
  key: string;
  kind: string;
  default: unknown;
  classMap?: Record<string, string>;
}[];

/** The class names in a rendered tree, from every element's `class` attribute. */
function classesIn(tree: unknown): Set<string> {
  const out = new Set<string>();
  const walk = (node: unknown): void => {
    if (typeof node !== "object" || node === null) return;
    const vnode = node as { attrs?: Record<string, unknown>; children?: unknown[] };
    const cls = vnode.attrs?.["class"];
    if (typeof cls === "string") for (const token of cls.split(/\s+/)) if (token) out.add(token);
    for (const child of vnode.children ?? []) walk(child);
  };
  walk(tree);
  return out;
}

/** A catalog component's fields; throws if the id is not in the catalog. */
function fieldsOf(id: string): Fields {
  const def = DAISY_COMPONENT_CATALOG.find((d) => d.id === id);
  if (!def) throw new Error(`no catalog component ${id}`);
  return def.fields as Fields;
}

/** The node for a component with its catalog defaults, one option changed. */
function nodeWith(id: string, fields: Fields, key: string, value: unknown) {
  const props: Record<string, unknown> = Object.fromEntries(fields.map((f) => [f.key, f.default]));
  props[key] = value;
  return { id: "node0001", type: "provider", provider: daisyUIProvider.id, component: id, props };
}

const renderClasses = (node: ReturnType<typeof nodeWith>) =>
  classesIn(daisyUIProvider.render(node as never));

// daisyUI's own CSS, from the installed package: the reference for which class names exist. A
// rendered class that matches the component's prefix (`btn-`, `badge-`) must be one of these.
const daisyCss = [
  ...new Glob("**/*.css").scanSync(join(import.meta.dir, "../../node_modules/daisyui")),
]
  .map((file) => readFileSync(join(import.meta.dir, "../../node_modules/daisyui", file), "utf8"))
  .join("\n");
const isDaisyClass = (token: string) => daisyCss.includes(`.${token}`);

describe("every classMap option is a real daisyUI class and reaches the rendered markup", () => {
  for (const def of DAISY_COMPONENT_CATALOG) {
    const fields = def.fields as Fields;
    for (const field of fields) {
      if (!field.classMap) continue;
      for (const [option, value] of Object.entries(field.classMap)) {
        const tokens = value.split(/\s+/).filter(Boolean);
        if (tokens.length === 0) continue;
        // Boolean fields key their classMap by "true" and "false"; the value is the boolean itself.
        const propValue = field.kind === "boolean" ? option === "true" : option;
        test(`${def.id}.${field.key} = ${option} renders ${tokens.join(" ")}`, () => {
          for (const token of tokens)
            if (token.startsWith(`${def.rootClass}-`))
              expect(isDaisyClass(token), `${token} is not a daisyUI class`).toBe(true);
          const rendered = renderClasses(nodeWith(def.id, fields, field.key, propValue));
          for (const token of tokens) expect(rendered.has(token), token).toBe(true);
        });
      }
    }
  }
});

describe("options handled in the component's build reach the markup", () => {
  test("a completed step takes the chosen colour", () => {
    const fields = fieldsOf("steps");
    const rendered = renderClasses(nodeWith("steps", fields, "tone", "accent"));
    expect(rendered.has("step-accent")).toBe(true);
  });

  test("turning off the timeline box removes timeline-box", () => {
    const fields = fieldsOf("timeline");
    expect(renderClasses(nodeWith("timeline", fields, "boxed", true)).has("timeline-box")).toBe(
      true,
    );
    expect(renderClasses(nodeWith("timeline", fields, "boxed", false)).has("timeline-box")).toBe(
      false,
    );
  });

  test("a half rating has two inputs per star with the half classes", () => {
    const fields = fieldsOf("rating");
    const tree = daisyUIProvider.render(nodeWith("rating", fields, "half", true) as never) as {
      children: { attrs: Record<string, string> }[];
    };
    const inputs = tree.children.filter((c) => c.attrs["type"] === "radio");
    expect(inputs.length).toBe(10);
    expect(inputs.some((c) => c.attrs["class"]?.includes("mask-half-1"))).toBe(true);
    expect(inputs.some((c) => c.attrs["class"]?.includes("mask-half-2"))).toBe(true);
  });

  test("allowing a clear adds the hidden first radio", () => {
    const fields = fieldsOf("rating");
    expect(renderClasses(nodeWith("rating", fields, "clearable", true)).has("rating-hidden")).toBe(
      true,
    );
  });

  test("a card picture is a figure before the body, behind the text when asked", () => {
    const fields = fieldsOf("card");
    const props: Record<string, unknown> = Object.fromEntries(
      fields.map((f) => [f.key, f.default]),
    );
    props["image"] = "/media/cover.jpg";
    props["imageFull"] = true;
    const tree = daisyUIProvider.render({
      id: "node0001",
      type: "provider",
      provider: daisyUIProvider.id,
      component: "card",
      props,
    } as never) as { children: { tag: string }[]; attrs: Record<string, string> };
    expect(tree.children[0]?.tag).toBe("figure");
    expect(tree.attrs["class"]).toContain("image-full");
  });
});
