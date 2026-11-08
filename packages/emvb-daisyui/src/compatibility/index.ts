import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";
import type { DaisyComponentNode } from "../types.ts";

export const DAISY_CATALOG_VERSION = 1;
export const SUPPORTED_DAISYUI_RANGE = ">=5.5.0 <6";
export const SUPPORTED_TAILWIND_RANGE = ">=4.1.0 <5";

export interface DaisyLayoutEnvelope { catalogVersion: number; nodes: DaisyComponentNode[]; }
export interface MigrationNotice { nodeId: string; message: string; }
export interface CompatibilityReport { compatible: boolean; errors: string[]; warnings: string[]; componentCount: number; classCount: number; }

const RENAMED_PROPS: Record<string, Record<string, string>> = {
  button: { text: "label" },
  badge: { text: "label" },
  alert: { text: "message" },
};

export function migrateDaisyLayout(input: DaisyLayoutEnvelope): { layout: DaisyLayoutEnvelope; notices: MigrationNotice[] } {
  if (input.catalogVersion > DAISY_CATALOG_VERSION) throw new Error(`Catalog version ${input.catalogVersion} is newer than supported version ${DAISY_CATALOG_VERSION}.`);
  const notices: MigrationNotice[] = [];
  const migrateNode = (node: DaisyComponentNode): DaisyComponentNode => {
    const renamed = RENAMED_PROPS[node.component] ?? {};
    const props = { ...node.props };
    for (const [oldKey, newKey] of Object.entries(renamed)) {
      if (oldKey in props && !(newKey in props)) {
        props[newKey] = props[oldKey];
        delete props[oldKey];
        notices.push({ nodeId: node.id, message: `Renamed ${node.component}.${oldKey} to ${newKey}.` });
      }
    }
    return { ...node, props, ...(node.children ? { children: node.children.map(migrateNode) } : {}) };
  };
  return { layout: { catalogVersion: DAISY_CATALOG_VERSION, nodes: input.nodes.map(migrateNode) }, notices };
}

export function compatibilityReport(): CompatibilityReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  const classes = new Set<string>();
  for (const definition of DAISY_COMPONENT_CATALOG) {
    if (ids.has(definition.id)) errors.push(`Duplicate component id: ${definition.id}`);
    ids.add(definition.id);
    if (!definition.rootClass.trim()) errors.push(`${definition.id} has no root class.`);
    for (const token of definition.rootClass.split(/\s+/)) if (token) classes.add(token);
    for (const field of definition.fields) {
      if (field.options && field.classMap) {
        for (const option of field.options) if (!(option in field.classMap)) errors.push(`${definition.id}.${field.key} has no class for ${option}.`);
      }
      for (const mapped of Object.values(field.classMap ?? {})) for (const token of mapped.split(/\s+/)) if (token) classes.add(token);
    }
  }
  if (ids.size < 40) warnings.push(`Catalog contains only ${ids.size} components; expected the WP9 catalog.`);
  return { compatible: errors.length === 0, errors, warnings, componentCount: ids.size, classCount: classes.size };
}
