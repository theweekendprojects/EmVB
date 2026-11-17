import type { DaisyVNode } from "./types.ts";

/** The value, or a thrown error that names what was missing. For tests and fixtures. */
export function must<T>(value: T | null | undefined, what = "value"): T {
  if (value === null || value === undefined) throw new Error(`missing ${what}`);
  return value;
}

/** A rendered child that must be an element, not text. For tests. */
export function element(child: DaisyVNode | string | undefined): DaisyVNode {
  if (child === undefined || typeof child === "string") throw new Error("expected an element");
  return child;
}
