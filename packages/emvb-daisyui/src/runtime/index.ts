import type { DaisyComponentNode } from "../types.ts";

export interface DaisyRenderContext {
  mode: "editor" | "public";
  previewState?: Readonly<Record<string, unknown>>;
}
const TRANSIENT_BY_COMPONENT: Readonly<Record<string, readonly string[]>> = {
  modal: ["open"],
  dropdown: ["open"],
  drawer: ["open", "checked"],
  swap: ["checked"],
  tabs: ["active"],
  carousel: ["current"],
};
const transientKeys = (node: DaisyComponentNode) => TRANSIENT_BY_COMPONENT[node.component] ?? [];

/** Separates runtime/editor preview state from authored defaults without changing unrelated controls. */
export function nodeForRender(
  node: DaisyComponentNode,
  context: DaisyRenderContext,
): DaisyComponentNode {
  const props = { ...node.props };
  if (node.component === "modal" || node.component === "dropdown")
    for (const key of transientKeys(node)) delete props[key];
  const preview = context.mode === "editor" ? context.previewState?.[node.id] : undefined;
  if (preview && typeof preview === "object") Object.assign(props, preview);
  if (node.props.defaultOpen === true && context.mode === "public") props.open = true;
  return { ...node, props, children: node.children?.map((child) => nodeForRender(child, context)) };
}

export function serializableNode(node: DaisyComponentNode): DaisyComponentNode {
  const props = { ...node.props };
  for (const key of transientKeys(node)) delete props[key];
  return { ...node, props, children: node.children?.map(serializableNode) };
}

export const DAISY_RUNTIME_SCRIPT = `document.addEventListener('click',e=>{const b=e.target.closest('[data-daisy-command]');if(!b)return;const id=b.getAttribute('aria-controls');const el=id&&document.getElementById(id);if(!el)return;const c=b.dataset.daisyCommand;if(c==='show-modal'&&el.showModal)el.showModal();if(c==='close'&&el.close)el.close();});`;
export * from "./browser.ts";
