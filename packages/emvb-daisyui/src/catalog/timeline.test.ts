import { describe, expect, test } from "bun:test";
import { serialize } from "../../../emvb/src/core/render/vnode.ts";
import { daisyUIProvider } from "../provider.ts";

// The timeline's box paints daisyUI's base colour (white in the light theme), so its text vanished
// on a dark page. The box must not paint a background of its own.
describe("timeline lines join the items, as in daisyUI's examples", () => {
  const build = (items: string) => {
    const node = daisyUIProvider.createNode("timeline", "tl000002");
    node.props.items = items;
    return serialize(daisyUIProvider.render(node) as never);
  };
  const lis = (html: string) =>
    html
      .split("<li>")
      .slice(1)
      .map((item) => item.split("</li>")[0] ?? "");

  test("each item but the last ends with a line; each item but the first starts with one", () => {
    const html = build("2024|A|a\n2025|B|b\n2026|C|c\n2027|D|d");
    const items = lis(html);
    expect(items).toHaveLength(4);
    expect(items[0]!.startsWith('<div class="timeline-start"')).toBe(true);
    expect(items[0]!.endsWith("<hr></li>") || items[0]!.endsWith("<hr>")).toBe(true);
    for (const item of items.slice(1)) expect(item.startsWith("<hr>")).toBe(true);
    expect(items[3]!.endsWith("<hr>")).toBe(false);
    expect(html.match(/<hr>/g)).toHaveLength(6);
  });

  test("one item has no line at all", () => {
    expect(build("2024|Only|one").match(/<hr>/g)).toBeNull();
  });
});

describe("timeline boxes stay readable on a dark page", () => {
  test("each milestone box is transparent and carries the date, title and description", () => {
    const node = daisyUIProvider.createNode("timeline", "tl000001");
    node.props.items = "2024|Started|Initial release\n2025|Expanded|New components";
    const html = serialize(daisyUIProvider.render(node) as never);
    const boxes = html.match(/<div class="timeline-end timeline-box[^"]*"/g) ?? [];
    expect(boxes).toHaveLength(2);
    for (const box of boxes) expect(box).toContain("bg-transparent");
    expect(html).toContain("<strong>Started</strong>");
    expect(html).toContain("<p>Initial release</p>");
  });
});
