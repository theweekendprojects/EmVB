import type { ElementDescriptor } from "../schema/descriptors.ts";
import type { VNode } from "../render/vnode.ts";

/** Shared shape of an element definition: defaults, descriptor, CSS, and its VNode build. */
/** Render options an element may read. Only the editor canvas differs from the public page. */
export type BuildOptions = { mode?: "editor" | "public" };

export type Build<N> = (
  node: N,
  attrs: Record<string, string>,
  children: VNode[],
  options?: BuildOptions,
) => VNode;

export type ElementDefinition<N> = {
  baseCss: string;
  build: Build<N>;
  descriptor: ElementDescriptor;
  defaults: () => Omit<N, "id">;
};
