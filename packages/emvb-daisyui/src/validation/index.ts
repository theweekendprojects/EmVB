import { daisyUIProvider } from "../provider.ts";
import type { DaisyComponentNode, DaisyFieldDefinition } from "../types.ts";

export type DaisyValidationCode =
  | "unknown-component"
  | "unknown-property"
  | "invalid-option"
  | "invalid-value"
  | "missing-label"
  | "invalid-nesting"
  | "duplicate-id";
export interface DaisyValidationIssue {
  code: DaisyValidationCode;
  nodeId: string;
  path: string;
  message: string;
}

const INTERACTIVE_LABELS = new Set([
  "button",
  "input",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "toggle",
  "file-input",
  "range",
  "rating",
]);
const CONTAINER_ONLY = new Set([
  "card",
  "navbar",
  "menu",
  "footer",
  "hero",
  "stack",
  "join",
  "indicator",
  "browser-mockup",
  "phone-mockup",
  "code-mockup",
  "drawer",
  "modal",
  "carousel",
  "tabs",
  "accordion",
]);

function validField(field: DaisyFieldDefinition, value: unknown): boolean {
  if (field.kind === "boolean") return typeof value === "boolean";
  if (field.kind === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === "string";
}

export function validateDaisyTree(nodes: readonly DaisyComponentNode[]): DaisyValidationIssue[] {
  const issues: DaisyValidationIssue[] = [];
  const ids = new Set<string>();
  const walk = (node: DaisyComponentNode, path: string) => {
    if (ids.has(node.id))
      issues.push({
        code: "duplicate-id",
        nodeId: node.id,
        path,
        message: `Duplicate node id ${node.id}.`,
      });
    ids.add(node.id);
    const generated = daisyUIProvider.components.get(node.component);
    if (!generated) {
      issues.push({
        code: "unknown-component",
        nodeId: node.id,
        path,
        message: `Unknown daisyUI component ${node.component}.`,
      });
      return;
    }
    const fields = new Map(generated.definition.fields.map((field) => [field.key, field]));
    for (const [key, value] of Object.entries(node.props)) {
      if (key === "theme") continue;
      const field = fields.get(key);
      if (!field)
        issues.push({
          code: "unknown-property",
          nodeId: node.id,
          path: `${path}.props.${key}`,
          message: `${key} is not supported by ${node.component}.`,
        });
      else if (!validField(field, value))
        issues.push({
          code: "invalid-value",
          nodeId: node.id,
          path: `${path}.props.${key}`,
          message: `${key} has the wrong value type.`,
        });
      else if (field.options && !field.options.includes(String(value)))
        issues.push({
          code: "invalid-option",
          nodeId: node.id,
          path: `${path}.props.${key}`,
          message: `${String(value)} is not an allowed ${key} value.`,
        });
    }
    if (INTERACTIVE_LABELS.has(node.component)) {
      const label = node.props.label ?? node.props.text ?? node.props.alt;
      if (typeof label !== "string" || !label.trim())
        issues.push({
          code: "missing-label",
          nodeId: node.id,
          path,
          message: `${node.component} requires a non-empty accessible label.`,
        });
    }
    if (
      (node.children?.length ?? 0) > 0 &&
      !generated.definition.container &&
      !CONTAINER_ONLY.has(node.component)
    ) {
      issues.push({
        code: "invalid-nesting",
        nodeId: node.id,
        path,
        message: `${node.component} does not accept child components.`,
      });
    }
    node.children?.forEach((child, index) => walk(child, `${path}.children[${index}]`));
  };
  nodes.forEach((node, index) => walk(node, `[${index}]`));
  return issues;
}

export const assertValidDaisyTree = (nodes: readonly DaisyComponentNode[]): void => {
  const issues = validateDaisyTree(nodes);
  if (issues.length)
    throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
};
