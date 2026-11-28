/**
 * Slots in an extension element's output (extensionApi 1.5).
 *
 * An element's render() marks where its stored children go with `{ type: "ext-slot", name }`. The
 * marker is output only, like the markup node: it is never stored, and it validates as an empty
 * container with its name kept beside the node (the same way extension classes are kept, W-1086).
 * At render the marker becomes the element's stored children that its manifest allows, and a
 * marker whose name the element does not declare renders nothing. The children are ordinary stored
 * nodes: the layout format is unchanged.
 */
import type { VNode } from "../render/vnode.ts";

/** The output-only marker's `type`. */
export const SLOT_TYPE = "ext-slot";

/** A slot name: a lowercase word (the same rule the manifest uses). */
export const SLOT_NAME_RULE = /^[a-z][a-z0-9-]{0,31}$/;

/** A validated output node, or a rendered VNode, that is a slot, by identity. */
const SLOT_NAMES = new WeakMap<object, string>();

/** Keeps a slot's name beside a validated output node or a rendered node. */
export function markSlot(node: object, name: string): void {
  SLOT_NAMES.set(node, name);
}

/** The slot name of a marked node, or undefined when it is not a slot. */
export function slotNameOf(node: object): string | undefined {
  return SLOT_NAMES.get(node);
}

/**
 * Replaces each slot marked under `root` with `fill(name)`, in a rebuilt copy: the children take the
 * marker's place directly, with no wrapper element. A wrapper would be invalid inside a table or a
 * list, where a slot holds rows or items, and it would break a kit's `ul > li` selectors. The tree
 * is not changed. The root itself is never a marker: it is the element's own wrapper.
 */
export function fillSlots(root: VNode, fill: (name: string) => VNode[]): VNode {
  return {
    tag: root.tag,
    attrs: root.attrs,
    children: root.children.flatMap((child): (VNode | string)[] => {
      if (typeof child === "string") return [child];
      const name = slotNameOf(child);
      return name === undefined ? [fillSlots(child, fill)] : fill(name);
    }),
  };
}
