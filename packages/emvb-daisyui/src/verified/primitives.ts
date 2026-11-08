import type { DaisyComponentNode, VNode } from "../types.ts";
import { daisyUIProvider } from "../provider.ts";

export const VERIFIED_PRIMITIVE_IDS = ["button", "badge", "alert", "card", "input", "textarea", "select", "checkbox", "toggle", "progress"] as const;

export interface PrimitiveAuditIssue { nodeId: string; code: string; message: string; }

export function auditVerifiedPrimitive(node: DaisyComponentNode): PrimitiveAuditIssue[] {
  const issues: PrimitiveAuditIssue[] = [];
  if (!(VERIFIED_PRIMITIVE_IDS as readonly string[]).includes(node.component)) return issues;
  const text = (key: string) => String(node.props[key] ?? "").trim();
  if (["button", "input", "textarea", "select", "checkbox", "toggle"].includes(node.component) && !text("label"))
    issues.push({ nodeId: node.id, code: "accessible-name", message: `${node.component} requires a non-empty label.` });
  if (node.component === "progress") {
    const value = Number(node.props.value); const max = Number(node.props.max);
    if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0 || value < 0 || value > max)
      issues.push({ nodeId: node.id, code: "progress-range", message: "Progress value must be between zero and max." });
  }
  return issues;
}

export function renderVerifiedPrimitive(node: DaisyComponentNode): VNode {
  if (!(VERIFIED_PRIMITIVE_IDS as readonly string[]).includes(node.component)) throw new Error(`${node.component} is not a verified primitive.`);
  return daisyUIProvider.render(node);
}

/** Stable structural signatures derived from official daisyUI v5 examples. */
export function primitiveSignature(vnode: VNode): string {
  const visit = (value: VNode | string): string => typeof value === "string" ? "#text" : `${value.tag}.${(value.attrs.class ?? "").split(/\s+/).filter(Boolean).join(".")}[${value.children.map(visit).join(",")}]`;
  return visit(vnode);
}
