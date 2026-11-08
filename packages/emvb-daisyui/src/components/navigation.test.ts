import { describe, expect, test } from "bun:test";
import { NAVIGATION_DAISY_COMPONENTS } from "../catalog/navigation.ts";
import { daisyUIProvider } from "../provider.ts";
import type { DaisyComponentNode, VNode } from "../types.ts";

const render = (component: string, props: Record<string, string | number | boolean>, children: VNode[] = []) =>
  daisyUIProvider.render({ id: `nav-${component}`, type: "daisy", component, props }, {}, children);
const walk = (node: VNode): VNode[] => [node, ...node.children.flatMap(child => typeof child === "string" ? [] : walk(child))];

describe("WP6 generated navigation components", () => {
  test("catalog adds seven navigation components", () => {
    expect(NAVIGATION_DAISY_COMPONENTS.map(item => item.id)).toEqual(["navbar", "menu", "breadcrumbs", "pagination", "steps", "dock", "footer"]);
  });

  test("all navigation landmarks have accessible labels or contentinfo semantics", () => {
    const cases = [
      render("navbar", { ariaLabel:"Primary", brand:"Brand", brandHref:"/", items:"Home|/", position:"static" }),
      render("menu", { ariaLabel:"Account", items:"Settings|/settings", direction:"vertical", size:"md" }),
      render("breadcrumbs", { ariaLabel:"Breadcrumb", items:"Home|/\nCurrent|" }),
      render("pagination", { ariaLabel:"Pagination", pages:3, current:2, baseHref:"?page=", size:"md" }),
      render("dock", { ariaLabel:"Mobile", items:"Home|/", active:"Home", size:"md" }),
      render("footer", { brand:"Brand", description:"Description", links:"Privacy|/privacy", layout:"horizontal" }),
    ];
    for (const item of cases) expect(item.attrs["aria-label"] || item.attrs.role === "contentinfo").toBeTruthy();
  });

  test("breadcrumbs, pagination, steps, and dock expose the current item", () => {
    expect(walk(render("breadcrumbs", { ariaLabel:"Breadcrumb", items:"Home|/\nCurrent|" })).some(item => item.attrs["aria-current"] === "page")).toBe(true);
    expect(walk(render("pagination", { ariaLabel:"Pagination", pages:5, current:3, baseHref:"?page=", size:"md" })).filter(item => item.attrs["aria-current"] === "page")).toHaveLength(1);
    expect(walk(render("steps", { items:"One\nTwo\nThree", current:2, direction:"horizontal" })).filter(item => item.attrs["aria-current"] === "step")).toHaveLength(1);
    expect(walk(render("dock", { ariaLabel:"Mobile", items:"Home|/\nProfile|/profile", active:"Profile", size:"md" })).filter(item => item.attrs["aria-current"] === "page")).toHaveLength(1);
  });

  test("pagination and steps clamp hostile persisted counts", () => {
    expect(render("pagination", { ariaLabel:"Pages", pages:9999, current:9999, baseHref:"?page=", size:"md" }).children).toHaveLength(20);
    const steps = render("steps", { items:"One\nTwo", current:99, direction:"horizontal" });
    expect(walk(steps).filter(item => item.attrs["aria-current"] === "step")).toHaveLength(1);
    expect(walk(steps).find(item => item.attrs["aria-current"] === "step")?.children).toEqual(["Two"]);
  });

  test("navigation rejects javascript and protocol-relative URLs", () => {
    const menu = render("menu", { ariaLabel:"Unsafe", items:"Bad|javascript:alert(1)\nCDN|//evil.example/x\nGood|/safe", direction:"vertical", size:"md" });
    const hrefs = walk(menu).map(item => item.attrs.href).filter(Boolean);
    expect(hrefs).toEqual(["#", "#", "/safe"]);
  });

  test("navbar and footer preserve child VNodes for future editor nesting", () => {
    const child: VNode = { tag:"button", attrs:{class:"btn"}, children:["Action"] };
    expect(JSON.stringify(render("navbar", { ariaLabel:"Primary", brand:"Brand", brandHref:"/", items:"Home|/", position:"static" }, [child]))).toContain("Action");
    expect(JSON.stringify(render("footer", { brand:"Brand", description:"Description", links:"Privacy|/privacy", layout:"horizontal" }, [child]))).toContain("Action");
  });

  test("semantic layout JSON round-trips without storing generated classes", () => {
    const original: DaisyComponentNode = { id:"nav1", type:"daisy", component:"navbar", props:{ ariaLabel:"Primary", brand:"EmVB", brandHref:"/", items:"Home|/", position:"sticky" }, children:[] };
    const restored = JSON.parse(JSON.stringify(original)) as DaisyComponentNode;
    expect(restored).toEqual(original);
    expect(JSON.stringify(restored)).not.toContain("navbar-start");
    expect(daisyUIProvider.render(restored).attrs.class).toBe("navbar sticky top-0 z-50");
  });

  test("raw class injection through options is ignored", () => {
    expect(render("menu", { ariaLabel:"Menu", items:"Home|/", direction:"fixed top-0", size:"[color:red]" }).attrs.class).toBe("menu");
  });
});
