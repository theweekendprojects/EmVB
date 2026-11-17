import type { DaisyComponentDefinition, DaisyComponentNode, VNode } from "../types.ts";
import { DIGITS_2_CLASS, valueClass } from "./value-class.ts";

type Unit = "d" | "h" | "m" | "s";
const ALL_UNITS: readonly Unit[] = ["d", "h", "m", "s"];
const DEFAULT_LABELS = ["days", "hours", "min", "sec"] as const;
const UNIT_SETS: Readonly<Record<string, readonly Unit[]>> = {
  dhms: ["d", "h", "m", "s"],
  dhm: ["d", "h", "m"],
  hms: ["h", "m", "s"],
  d: ["d"],
};
const SIZES: Readonly<Record<string, string>> = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl",
};
// [grid/flex content alignment, text alignment] for each Alignment option.
const ALIGN: Readonly<Record<string, readonly [string, string]>> = {
  start: ["justify-start", "text-start"],
  center: ["justify-center", "text-center"],
  end: ["justify-end", "text-end"],
};

/** Time zones in the picker. `viewer` is each visitor's own clock; the rest are fixed instants. */
export const COUNTDOWN_ZONES: ReadonlyArray<readonly [string, string]> = [
  ["viewer", "Visitor's own time zone"],
  ["UTC", "UTC"],
  ["Europe/London", "London"],
  ["Europe/Berlin", "Berlin, Paris, Rome"],
  ["America/New_York", "New York"],
  ["America/Chicago", "Chicago"],
  ["America/Los_Angeles", "Los Angeles"],
  ["Asia/Dubai", "Dubai"],
  ["Asia/Dhaka", "Dhaka"],
  ["Asia/Kolkata", "India"],
  ["Asia/Singapore", "Singapore"],
  ["Asia/Tokyo", "Tokyo"],
  ["Australia/Sydney", "Sydney"],
];

const pad = (n: number) => String(n).padStart(2, "0");

/** `YYYY-MM-DDTHH:mm` for a date, read in UTC or in the machine's own zone. */
export function pickerTime(date: Date, utc = false): string {
  const [y, mo, d, h, mi] = utc
    ? [
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
      ]
    : [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()];
  return `${y}-${pad(mo! + 1)}-${pad(d!)}T${pad(h!)}:${pad(mi!)}`;
}

/** A target `days` from now at `hour:00`, in the form the date picker stores. */
export function targetIn(days: number, hour: number, utc = false): string {
  const at = new Date();
  if (utc) at.setUTCDate(at.getUTCDate() + days);
  else at.setDate(at.getDate() + days);
  return pickerTime(
    utc ? new Date(at.setUTCHours(hour, 0, 0, 0)) : new Date(at.setHours(hour, 0, 0, 0)),
    utc,
  );
}

/** How far a zone's clock is ahead of UTC at an instant, in ms. Throws RangeError for a bad zone. */
function offsetMs(instant: number, zone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(instant))
      .map((part) => [part.type, part.value]),
  );
  const shown = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return shown - Math.floor(instant / 1000) * 1000;
}

/** The instant a wall-clock reading (`YYYY-MM-DDTHH:mm:ss`) happens in a zone, or NaN. */
export function wallToInstant(wall: string, zone: string): number {
  const [y, mo, d, h, mi, s] = wall.split(/[-T:]/).map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, s);
  if (zone === "UTC") return asUtc;
  try {
    // Two passes: the offset at the guess can differ from the offset at the answer around a DST change.
    const first = asUtc - offsetMs(asUtc, zone);
    return asUtc - offsetMs(first, zone);
  } catch {
    return Number.NaN;
  }
}

const INSTANT = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})$/;
const WALL = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

export type CountdownTarget = { kind: "instant"; ms: number } | { kind: "local"; wall: string };

/**
 * What the Ends-at field means. A reading with its own `Z` or offset is that exact instant. A bare
 * reading is read in the chosen zone, or on each visitor's clock for `viewer`. Anything else is
 * not a date, so the component falls back to its fixed number.
 */
export function parseTarget(raw: unknown, zone: unknown): CountdownTarget | undefined {
  const text = String(raw ?? "").trim();
  if (INSTANT.test(text)) {
    const ms = Date.parse(text.replace(" ", "T").replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
    return Number.isNaN(ms) ? undefined : { kind: "instant", ms };
  }
  const m = WALL.exec(text);
  if (!m) return undefined;
  const part = (i: number) => (m[i] === undefined ? 0 : Number(m[i]));
  const [y, mo, d, h, mi, s] = [part(1), part(2), part(3), part(4), part(5), part(6)] as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  const real =
    probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
  if (!real || h > 23 || mi > 59 || s > 59) return undefined;
  const wall = `${m[1]}-${m[2]}-${m[3]}T${pad(h)}:${pad(mi)}:${pad(s)}`;
  const where = String(zone ?? "viewer");
  if (where === "viewer") return { kind: "local", wall };
  const ms = wallToInstant(wall, where);
  return Number.isNaN(ms) ? undefined : { kind: "instant", ms };
}

/** Each unit's number for `left` seconds. Without days, hours count every hour left. Daisy stops at 999. */
export function remaining(left: number, units: readonly Unit[]): Record<Unit, number> {
  const cap = (n: number) => Math.min(n, 999);
  const days = units.includes("d");
  return {
    d: cap(Math.floor(left / 86400)),
    h: cap(days ? Math.floor((left % 86400) / 3600) : Math.floor(left / 3600)),
    m: cap(Math.floor((left % 3600) / 60)),
    s: left % 60,
  };
}

const unitLabels = (raw: unknown): string[] => {
  const given = String(raw ?? "").split("|");
  return DEFAULT_LABELS.map((fallback, i) => given[i]?.trim().slice(0, 24) || fallback);
};

const clampNumber = (value: unknown, min: number, max: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};

function fixedNumber(node: DaisyComponentNode, classes: string[]): VNode {
  const max = clampNumber(node.props.max, 1, 999);
  const value = clampNumber(node.props.value, 0, max);
  const suffix = String(node.props.suffix ?? "").trim();
  return {
    tag: "span",
    attrs: {
      class: classes.join(" "),
      role: "timer",
      "aria-label": `${node.props.label}: ${value}${suffix ? ` ${suffix}` : ""}`,
    },
    children: [
      {
        tag: "span",
        // The class is the first paint (up to 100); the runtime sets the variable for any value.
        attrs: { class: valueClass(value), "data-daisy-value": String(value) },
        children: [String(value)],
      },
      // Its own span with a margin: a space at the start of text inside a flex row is dropped.
      ...(suffix
        ? [{ tag: "span", attrs: { class: "ms-2" }, children: [suffix] } satisfies VNode]
        : []),
    ],
  };
}

function dateCountdown(
  node: DaisyComponentNode,
  classes: string[],
  target: CountdownTarget,
): VNode {
  const p = node.props;
  const units = UNIT_SETS[String(p.units)] ?? UNIT_SETS.dhms!;
  const layout = p.layout === "plain" || p.layout === "clock" ? p.layout : "boxes";
  const [justify, textAlign] = ALIGN[String(p.align)] ?? ALIGN.center!;
  const message = String(p.expired ?? "")
    .trim()
    .slice(0, 200);
  // A visitor-clock reading cannot be placed on the server, so the first paint reads it as UTC.
  const ms = target.kind === "instant" ? target.ms : Date.parse(`${target.wall}Z`);
  const now = Date.now();
  const left = Math.max(0, Math.floor((ms - now) / 1000));
  // Over means the deadline has passed, not "under a second left": the clock reads 0 until then.
  const done = message !== "" && ms <= now && target.kind === "instant";
  const values = remaining(left, units);
  const labels = unitLabels(p.labels);

  const number = (unit: Unit): VNode => ({
    tag: "span",
    attrs: {
      class:
        unit === "d" ? valueClass(values[unit]) : `${valueClass(values[unit])} ${DIGITS_2_CLASS}`,
      "data-daisy-unit": unit,
    },
    children: [String(values[unit])],
  });

  const box = (unit: Unit): VNode => ({
    tag: "div",
    attrs: {
      class:
        layout === "boxes"
          ? "flex flex-col items-center gap-1 p-3 bg-neutral rounded-box text-neutral-content"
          : "flex flex-col items-center gap-1",
    },
    children: [
      { tag: "span", attrs: { class: classes.join(" ") }, children: [number(unit)] },
      {
        tag: "span",
        attrs: { class: "text-xs opacity-80" },
        children: [labels[ALL_UNITS.indexOf(unit)]!],
      },
    ],
  });

  const face: VNode =
    layout === "clock"
      ? {
          tag: "div",
          attrs: { class: `flex ${justify}` },
          children: [
            {
              tag: "span",
              attrs: { class: classes.join(" ") },
              children: units.flatMap((unit, i) =>
                i === 0 ? [number(unit)] : [":", number(unit)],
              ),
            },
          ],
        }
      : {
          tag: "div",
          attrs: { class: `grid auto-cols-max grid-flow-col gap-4 text-center ${justify}` },
          children: units.map(box),
        };

  const size = SIZES[String(p.size)] ?? SIZES.md!;
  return {
    tag: "div",
    attrs: {
      class: "w-full",
      role: done ? "status" : "timer",
      "aria-label": String(p.label),
      ...(target.kind === "instant"
        ? { "data-daisy-countdown": new Date(target.ms).toISOString() }
        : { "data-daisy-countdown-local": target.wall }),
    },
    children: [
      {
        tag: "div",
        attrs: { "data-daisy-live": "", ...(done ? { class: "hidden" } : {}) },
        children: [face],
      },
      ...(message
        ? [
            {
              tag: "div",
              attrs: {
                "data-daisy-done": "",
                class: `${size} font-semibold py-3 ${textAlign}${done ? "" : " hidden"}`,
              },
              children: [message],
            } satisfies VNode,
          ]
        : []),
    ],
  };
}

export const COUNTDOWN: DaisyComponentDefinition = {
  id: "countdown",
  label: "Countdown",
  category: "Data display",
  tag: "span",
  rootClass: "countdown font-mono",
  fields: [
    { key: "label", label: "Accessible label", kind: "text", default: "Time remaining" },
    { key: "target", label: "Ends at", kind: "datetime", default: "" },
    {
      key: "zone",
      label: "Time zone",
      kind: "select",
      default: "viewer",
      options: COUNTDOWN_ZONES.map(([id]) => id),
      optionLabels: Object.fromEntries(COUNTDOWN_ZONES),
    },
    {
      key: "units",
      label: "Show",
      kind: "select",
      default: "dhms",
      options: ["dhms", "dhm", "hms", "d"],
      optionLabels: {
        dhms: "Days, hours, minutes, seconds",
        dhm: "Days, hours, minutes",
        hms: "Hours, minutes, seconds",
        d: "Days only",
      },
    },
    {
      key: "layout",
      label: "Layout",
      kind: "select",
      default: "boxes",
      options: ["boxes", "plain", "clock"],
      optionLabels: { boxes: "Boxes", plain: "Plain", clock: "Clock (12:34:56)" },
    },
    {
      key: "align",
      label: "Alignment",
      kind: "select",
      default: "center",
      options: ["start", "center", "end"],
    },
    {
      key: "size",
      label: "Size",
      kind: "select",
      default: "md",
      options: ["sm", "md", "lg", "xl"],
      classMap: SIZES,
    },
    {
      key: "labels",
      label: "Unit labels, separated by |",
      kind: "text",
      default: "days|hours|min|sec",
    },
    {
      key: "expired",
      label: "Message when time is up (empty keeps zeros)",
      kind: "text",
      default: "",
    },
    { key: "value", label: "Fixed number (only when no date is set)", kind: "number", default: 42 },
    { key: "max", label: "Fixed number maximum", kind: "number", default: 99 },
    { key: "suffix", label: "Fixed number suffix", kind: "text", default: " seconds" },
  ],
  // A countdown that is added already counts down: a week from now at 09:00 on the visitor's clock.
  initial: () => ({ target: targetIn(7, 9) }),
  build(node, classes) {
    const target = parseTarget(node.props.target, node.props.zone);
    return target ? dateCountdown(node, classes, target) : fixedNumber(node, classes);
  },
};
