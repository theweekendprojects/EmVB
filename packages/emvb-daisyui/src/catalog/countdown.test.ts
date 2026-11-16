import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { serialize } from "../../../emvb/src/core/render/vnode.ts";
import { daisyUIProvider } from "../provider.ts";
import { DAISY_INTERACTIVE_RUNTIME } from "../runtime/browser.ts";
import { VALUE_CLASS_NAMES, valueClass } from "./value-class.ts";
import { CATALOG_CLASS_NAMES } from "./class-names.ts";

const render = (props: Record<string, string | number>) => {
  const node = daisyUIProvider.createNode("countdown", "cd000001");
  Object.assign(node.props, props);
  return daisyUIProvider.render(node);
};

describe("countdown", () => {
  test("a fixed number carries its value as a class and a data attribute, never as style", () => {
    const html = serialize(render({ value: 42 }) as never);
    expect(html).toContain("[--value:42]");
    expect(html).toContain('data-daisy-value="42"');
    expect(html).not.toContain("style=");
  });

  test("a valid target date makes four live boxes", () => {
    const html = serialize(render({ target: "2099-12-31T00:00:00Z" }) as never);
    expect(html).toContain('data-daisy-countdown="2099-12-31T00:00:00.000Z"');
    for (const unit of ["d", "h", "m", "s"]) expect(html).toContain(`data-daisy-unit="${unit}"`);
    expect(html).toContain("[--digits:2]");
  });

  test("a target that is not a date falls back to the fixed number", () => {
    for (const target of ["tomorrow", "2026-13-45", "<script>", "  "]) {
      const html = serialize(render({ target, value: 7 }) as never);
      expect(html).not.toContain("data-daisy-countdown");
      expect(html).toContain("[--value:7]");
    }
  });

  test("a date in the past shows zeros", () => {
    const html = serialize(render({ target: "2000-01-01T00:00:00Z" }) as never);
    expect(html).not.toContain("[--value:1");
    expect(html.match(/\[--value:0\]/g)?.length).toBe(4);
  });

  test("the runtime is requested, and every first-paint class is in the literal list", () => {
    const node = daisyUIProvider.createNode("countdown", "cd000002");
    expect(daisyUIProvider.needsRuntime?.(node)).toBe(true);
    for (const name of [...VALUE_CLASS_NAMES, "[--digits:2]"])
      expect(CATALOG_CLASS_NAMES).toContain(name as never);
    expect(valueClass(999)).toBe("[--value:100]");
  });
});

describe("countdown runtime", () => {
  test("sets --value for a fixed number above the class range and ticks a date", () => {
    const window = new Window();
    const target = new Date(Date.now() + ((1 * 24 + 2) * 3600 + 3 * 60 + 4) * 1000 + 500).toISOString();
    window.document.body.innerHTML =
      '<span data-daisy-value="365">0</span>' +
      `<div data-daisy-countdown="${target}">` +
      '<span data-daisy-unit="d">0</span><span data-daisy-unit="h">0</span>' +
      '<span data-daisy-unit="m">0</span><span data-daisy-unit="s">0</span></div>';
    window.eval(DAISY_INTERACTIVE_RUNTIME);

    const get = (selector: string) => window.document.querySelector(selector) as HTMLElement;
    expect(get("[data-daisy-value]").style.getPropertyValue("--value")).toBe("365");
    expect(get('[data-daisy-unit="d"]').style.getPropertyValue("--value")).toBe("1");
    expect(get('[data-daisy-unit="h"]').style.getPropertyValue("--value")).toBe("2");
    expect(get('[data-daisy-unit="m"]').style.getPropertyValue("--value")).toBe("3");
    expect(["3", "4"]).toContain(get('[data-daisy-unit="s"]').style.getPropertyValue("--value"));
    window.close();
  });
});
