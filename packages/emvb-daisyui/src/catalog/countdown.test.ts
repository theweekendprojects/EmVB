import { must } from "../test-support.ts";
import { afterEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { serialize } from "../../../emvb/src/core/render/vnode.ts";
import { ProviderNode } from "../../../emvb/src/core/schema/layout.ts";
import { daisyUIProvider } from "../provider.ts";
import { DAISY_RECIPES } from "../recipes/index.ts";
import { DAISY_INTERACTIVE_RUNTIME } from "../runtime/browser.ts";
import { CATALOG_CLASS_NAMES } from "./class-names.ts";
import {
  COUNTDOWN_ZONES,
  parseTarget,
  pickerTime,
  remaining,
  targetIn,
  wallToInstant,
} from "./countdown.ts";
import { VALUE_CLASS_NAMES, valueClass } from "./value-class.ts";

type Props = Record<string, string | number | boolean>;

const DAY = 86400;
const inFuture = (seconds: number, extraMs = 500) =>
  new Date(Date.now() + seconds * 1000 + extraMs).toISOString();

const vnode = (props: Props) => {
  const node = daisyUIProvider.createNode("countdown", "cd000001");
  Object.assign(node.props, props);
  return daisyUIProvider.render(node);
};

const windows: Window[] = [];
afterEach(() => {
  for (const window of windows.splice(0)) window.close();
});
const dom = (props: Props) => {
  const window = new Window();
  windows.push(window);
  window.document.body.innerHTML = serialize(vnode(props) as never);
  return window;
};
const units = (window: Window) =>
  Object.fromEntries(
    [...window.document.querySelectorAll("[data-daisy-unit]")].map((el) => [
      (el as HTMLElement).dataset.daisyUnit,
      el.textContent,
    ]),
  );
const cssValues = (window: Window) =>
  Object.fromEntries(
    [...window.document.querySelectorAll("[data-daisy-unit]")].map((el) => [
      (el as HTMLElement).dataset.daisyUnit,
      (el as HTMLElement).style.getPropertyValue("--value"),
    ]),
  );

describe("fixed number mode", () => {
  test("no date: the value is a class and a data attribute, never style", () => {
    const html = serialize(vnode({ target: "", value: 42 }) as never);
    expect(html).toContain("[--value:42]");
    expect(html).toContain('data-daisy-value="42"');
    expect(html).not.toContain("style=");
    expect(html).not.toContain("data-daisy-countdown");
  });

  test("the suffix has its own gap (a leading space inside a flex row is dropped)", () => {
    const html = serialize(vnode({ target: "", value: 42, suffix: " seconds" }) as never);
    expect(html).toContain('<span class="ms-2">seconds</span>');
    expect(html).toContain('aria-label="Time remaining: 42 seconds"');
    expect(serialize(vnode({ target: "", value: 42, suffix: "" }) as never)).not.toContain("ms-2");
  });

  test("a target that is not a date falls back to the fixed number", () => {
    for (const target of [
      "tomorrow",
      "2026-13-45",
      "2026-02-30",
      "<script>",
      "  ",
      "2026-12-31T25:00",
    ]) {
      const html = serialize(vnode({ target, value: 7 }) as never);
      expect(html, target).not.toContain("data-daisy-countdown");
      expect(html, target).toContain("[--value:7]");
    }
  });
});

describe("a new countdown works at once", () => {
  test("it starts with a date about a week out, in the picker's format", () => {
    const node = daisyUIProvider.createNode("countdown", "cd000009");
    const target = String(node.props.target);
    expect(target).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    const days = (Date.parse(`${target}:00Z`) - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(5);
    expect(days).toBeLessThan(9);
    expect(units(dom({}))).toHaveProperty("d");
  });

  test("pickerTime and targetIn agree with the clock they read", () => {
    const fixed = new Date(Date.UTC(2026, 11, 31, 18, 5));
    expect(pickerTime(fixed, true)).toBe("2026-12-31T18:05");
    expect(targetIn(0, 9, true)).toMatch(/T09:00$/);
    expect(targetIn(3, 0)).toMatch(/T00:00$/);
  });
});

describe("what Ends at means", () => {
  test("a reading with Z or an offset is that exact instant, whatever the zone", () => {
    const want = Date.UTC(2026, 11, 31, 17, 0, 0);
    for (const text of [
      "2026-12-31T17:00:00Z",
      "2026-12-31 17:00Z",
      "2026-12-31T18:00:00+01:00",
      "2026-12-31T18:00+0100",
      "2026-12-31T17:00:00.000Z",
    ])
      expect(parseTarget(text, "Asia/Tokyo"), text).toEqual({ kind: "instant", ms: want });
  });

  test("a bare reading is read in the chosen zone", () => {
    expect(parseTarget("2026-12-31T18:00", "UTC")).toEqual({
      kind: "instant",
      ms: Date.UTC(2026, 11, 31, 18),
    });
    expect(parseTarget("2026-12-31T18:00", "Europe/Berlin")).toEqual({
      kind: "instant",
      ms: Date.UTC(2026, 11, 31, 17),
    });
    expect(parseTarget("2026-12-31", "UTC")).toEqual({
      kind: "instant",
      ms: Date.UTC(2026, 11, 31),
    });
  });

  test("for the visitor's own zone it stays a wall time for the browser to place", () => {
    expect(parseTarget("2026-12-31T18:00", "viewer")).toEqual({
      kind: "local",
      wall: "2026-12-31T18:00:00",
    });
    expect(parseTarget("2026-12-31T18:00", undefined)).toEqual({
      kind: "local",
      wall: "2026-12-31T18:00:00",
    });
  });

  test("an unknown zone is refused instead of guessed", () => {
    expect(parseTarget("2026-12-31T18:00", "Mars/Olympus")).toBeUndefined();
  });

  test("every zone in the picker is real", () => {
    for (const [zone] of COUNTDOWN_ZONES) {
      if (zone === "viewer") continue;
      expect(Number.isNaN(wallToInstant("2026-06-01T12:00:00", zone)), zone).toBe(false);
    }
  });
});

describe("time zones (independent of the machine's own zone)", () => {
  const at = (wall: string, zone: string) => new Date(wallToInstant(wall, zone)).toISOString();
  test("Berlin: +1 in winter, +2 in summer", () => {
    expect(at("2026-12-31T18:00:00", "Europe/Berlin")).toBe("2026-12-31T17:00:00.000Z");
    expect(at("2026-07-01T18:00:00", "Europe/Berlin")).toBe("2026-07-01T16:00:00.000Z");
  });
  test("New York: -5 in winter, -4 in summer", () => {
    expect(at("2026-12-31T18:00:00", "America/New_York")).toBe("2026-12-31T23:00:00.000Z");
    expect(at("2026-07-01T12:00:00", "America/New_York")).toBe("2026-07-01T16:00:00.000Z");
  });
  test("Dhaka +6 and India +5:30 have no daylight saving", () => {
    expect(at("2026-12-31T18:00:00", "Asia/Dhaka")).toBe("2026-12-31T12:00:00.000Z");
    expect(at("2026-12-31T18:00:00", "Asia/Kolkata")).toBe("2026-12-31T12:30:00.000Z");
  });
  test("Sydney is +11 in December (southern summer)", () => {
    expect(at("2026-12-31T18:00:00", "Australia/Sydney")).toBe("2026-12-31T07:00:00.000Z");
  });
  test("either side of the autumn change in Berlin (25 Oct 2026)", () => {
    expect(at("2026-10-24T12:00:00", "Europe/Berlin")).toBe("2026-10-24T10:00:00.000Z");
    expect(at("2026-10-25T12:00:00", "Europe/Berlin")).toBe("2026-10-25T11:00:00.000Z");
  });
});

describe("units", () => {
  const left = 3 * DAY + 5 * 3600 + 2 * 60 + 7;
  test("days, hours, minutes, seconds", () => {
    expect(remaining(left, ["d", "h", "m", "s"])).toEqual({ d: 3, h: 5, m: 2, s: 7 });
  });
  test("without days, hours count every hour left", () => {
    expect(remaining(left, ["h", "m", "s"])).toMatchObject({ h: 77, m: 2, s: 7 });
  });
  test("daisy stops at 999", () => {
    expect(remaining(2000 * DAY, ["d"]).d).toBe(999);
    expect(remaining(2000 * DAY, ["h", "m", "s"]).h).toBe(999);
  });
  test("each Show option renders exactly its units", () => {
    const want: Record<string, string[]> = {
      dhms: ["d", "h", "m", "s"],
      dhm: ["d", "h", "m"],
      hms: ["h", "m", "s"],
      d: ["d"],
    };
    for (const [show, expected] of Object.entries(want))
      expect(
        Object.keys(units(dom({ target: inFuture(left), zone: "UTC", units: show }))),
        show,
      ).toEqual(expected);
  });
});

describe("layouts", () => {
  const future = inFuture(10 * DAY);
  test("boxes put each unit on a card with its label", () => {
    const window = dom({ target: future, layout: "boxes" });
    expect(window.document.body.innerHTML).toContain("bg-neutral");
    expect(window.document.body.textContent).toContain("days");
    expect(window.document.body.textContent).toContain("sec");
  });
  test("plain has no boxes", () => {
    const window = dom({ target: future, layout: "plain" });
    expect(window.document.body.innerHTML).not.toContain("bg-neutral");
    expect(window.document.body.textContent).toContain("hours");
  });
  test("clock is one line with colons and no labels", () => {
    const window = dom({ target: future, layout: "clock", units: "hms" });
    const text = window.document.querySelector("[data-daisy-live]")?.textContent ?? "";
    expect(text).toMatch(/^\d+:\d+:\d+$/);
    expect(text).not.toContain("hours");
    expect(window.document.querySelectorAll(".countdown")).toHaveLength(1);
  });
  test("labels can be translated, and a blank one falls back", () => {
    const window = dom({ target: future, layout: "plain", labels: "Tage|Stunden||Sek" });
    const text = window.document.body.textContent ?? "";
    for (const word of ["Tage", "Stunden", "min", "Sek"]) expect(text).toContain(word);
  });
  test("a label cannot inject markup", () => {
    const window = dom({ target: future, layout: "plain", labels: "<b>x</b>|||" });
    expect(window.document.querySelector("b")).toBeNull();
  });
});

describe("when time is up", () => {
  const message = "The sale has ended.";
  const done = (window: Window) =>
    window.document.querySelector("[data-daisy-done]") as HTMLElement | null;
  const live = (window: Window) =>
    window.document.querySelector("[data-daisy-live]") as HTMLElement;

  test("already over: the message shows and the clock is hidden, before any script runs", () => {
    const window = dom({ target: "2000-01-01T00:00:00Z", expired: message });
    expect(done(window)?.textContent).toBe(message);
    expect(done(window)?.className).not.toContain("hidden");
    expect(live(window).className).toContain("hidden");
    expect(window.document.querySelector("[role]")?.getAttribute("role")).toBe("status");
  });
  test("still running: the message waits, hidden", () => {
    const window = dom({ target: inFuture(DAY), expired: message });
    expect(done(window)?.className).toContain("hidden");
    expect(live(window).className).not.toContain("hidden");
  });
  test("no message: zeros stay and there is nothing to swap in", () => {
    const window = dom({ target: "2000-01-01T00:00:00Z", expired: "" });
    expect(done(window)).toBeNull();
    expect(Object.values(units(window))).toEqual(["0", "0", "0", "0"]);
  });
  test("under a second to go is not over: the message waits for the deadline itself", async () => {
    const window = dom({ target: inFuture(0, 900), zone: "UTC", expired: message });
    expect(done(window)?.className).toContain("hidden");
    window.eval(DAISY_INTERACTIVE_RUNTIME);
    expect(Object.values(units(window))).toEqual(["0", "0", "0", "0"]);
    expect(done(window)?.className).toContain("hidden");
    await new Promise((resolve) => setTimeout(resolve, 1300));
    expect(done(window)?.className).not.toContain("hidden");
  });
  test("a visitor-clock date is never marked over on the server (the server cannot know)", () => {
    const window = dom({ target: "2000-01-01T00:00", zone: "viewer", expired: message });
    expect(done(window)?.className).toContain("hidden");
  });
});

describe("the runtime ticks the markup the server wrote", () => {
  const run = (window: Window) => window.eval(DAISY_INTERACTIVE_RUNTIME);
  const secondsLeft = 3 * DAY + 5 * 3600 + 2 * 60 + 7;

  test("an exact instant matches the server's unit math for every Show option", () => {
    for (const show of ["dhms", "dhm", "hms", "d"]) {
      const window = dom({ target: inFuture(secondsLeft), zone: "UTC", units: show });
      run(window);
      const expected = remaining(
        secondsLeft,
        Object.keys(units(window)) as ("d" | "h" | "m" | "s")[],
      );
      for (const [unit, value] of Object.entries(cssValues(window)))
        expect(value, `${show} ${unit}`).toBe(String(expected[unit as "d"]));
    }
  });

  test("a visitor-clock reading is placed on the visitor's own clock", () => {
    const at = new Date(Date.now() + secondsLeft * 1000 + 500);
    const wall = pickerTime(at).replace(/$/, `:${String(at.getSeconds()).padStart(2, "0")}`);
    const window = dom({ target: wall, zone: "viewer" });
    run(window);
    expect(cssValues(window)).toMatchObject({ d: "3", h: "5", m: "2" });
  });

  test("it counts down", async () => {
    const window = dom({ target: inFuture(60, 400), zone: "UTC", units: "hms" });
    run(window);
    const first = Number(cssValues(window).s);
    await new Promise((resolve) => setTimeout(resolve, 2300));
    const later = Number(cssValues(window).s);
    expect((first - later + 60) % 60).toBeGreaterThanOrEqual(2);
  });

  test("it swaps in the message the moment it reaches zero", async () => {
    const window = dom({ target: inFuture(1, 300), zone: "UTC", expired: "All done" });
    run(window);
    const done = window.document.querySelector("[data-daisy-done]") as HTMLElement;
    expect(done.className).toContain("hidden");
    await new Promise((resolve) => setTimeout(resolve, 2400));
    expect(done.className).not.toContain("hidden");
    expect((window.document.querySelector("[data-daisy-live]") as HTMLElement).className).toContain(
      "hidden",
    );
    expect(window.document.querySelector("[data-daisy-countdown]")?.getAttribute("role")).toBe(
      "status",
    );
  });

  test("a fixed number above the class range is set by the runtime", () => {
    const window = dom({ target: "", value: 365, max: 999 });
    run(window);
    expect(
      (window.document.querySelector("[data-daisy-value]") as HTMLElement).style.getPropertyValue(
        "--value",
      ),
    ).toBe("365");
  });
});

describe("recipes", () => {
  const countdownRecipes = DAISY_RECIPES.filter((recipe) => recipe.id.startsWith("countdown-"));
  const create = (id: string) => {
    let n = 0;
    return must(
      countdownRecipes.find((recipe) => recipe.id === id),
      id,
    ).create(() => `rc${String(++n).padStart(6, "0")}`);
  };
  const find = (
    nodes: ReturnType<typeof create>,
    component: string,
  ): ReturnType<typeof create>[number] | undefined => {
    for (const node of nodes) {
      if (node.component === component) return node;
      const inner = node.children ? find(node.children, component) : undefined;
      if (inner) return inner;
    }
    return undefined;
  };

  test("there are five, and each one counts down to a real date in the future", () => {
    expect(countdownRecipes.map((recipe) => recipe.id)).toEqual([
      "countdown-launch",
      "countdown-sale",
      "countdown-event",
      "countdown-flash",
      "countdown-earlybird",
    ]);
    for (const recipe of countdownRecipes) {
      const counter = must(find(create(recipe.id), "countdown"), recipe.id);
      const target = parseTarget(counter.props.target, counter.props.zone);
      expect(target, recipe.id).toBeDefined();
      const t = must(target, recipe.id);
      const ms = t.kind === "instant" ? t.ms : Date.parse(`${t.wall}Z`);
      expect(ms - Date.now(), recipe.id).toBeGreaterThan(DAY * 1000);
    }
  });

  test("each recipe is valid layout data and passes the output allowlist", () => {
    for (const recipe of countdownRecipes) {
      for (const node of create(recipe.id)) {
        const parsed = ProviderNode.safeParse(strip(node));
        expect(parsed.success, `${recipe.id}: ${JSON.stringify(parsed.error?.issues[0])}`).toBe(
          true,
        );
        expect(() =>
          serialize(daisyUIProvider.render(node, {}, [], { mode: "public" }) as never),
        ).not.toThrow();
      }
    }
  });

  test("the variants really differ", () => {
    const layouts = countdownRecipes.map(
      (recipe) => must(find(create(recipe.id), "countdown"), recipe.id).props.layout,
    );
    expect(new Set(layouts)).toEqual(new Set(["boxes", "plain", "clock"]));
    const showing = countdownRecipes.map(
      (recipe) => must(find(create(recipe.id), "countdown"), recipe.id).props.units,
    );
    expect(new Set(showing)).toEqual(new Set(["dhms", "dhm", "hms", "d"]));
  });
});

// A node as the layout stores it: no children typing concerns for the provider-props check.
function strip(node: {
  id: string;
  type: string;
  component: string;
  props: Props;
  children?: unknown[];
}) {
  return {
    id: node.id,
    type: node.type,
    provider: "daisyui",
    component: node.component,
    props: node.props,
    children: [],
  };
}

describe("class list", () => {
  test("every first-paint class is written out for the scanner", () => {
    for (const name of [...VALUE_CLASS_NAMES, "[--digits:2]", "text-7xl"])
      expect(CATALOG_CLASS_NAMES).toContain(name as never);
    expect(valueClass(999)).toBe("[--value:100]");
  });
  test("the runtime is requested for countdown", () => {
    expect(
      daisyUIProvider.needsRuntime?.(daisyUIProvider.createNode("countdown", "cd000002")),
    ).toBe(true);
  });
});
