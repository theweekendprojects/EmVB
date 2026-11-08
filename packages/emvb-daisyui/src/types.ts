import type { ComponentProvider as NeutralComponentProvider, ProviderComponent, ProviderComponentDescriptor, ProviderComponentNode, ProviderFieldKind, ProviderFieldValue, ProviderProps, ProviderVNode } from "@perkyzz/emvb-provider-api";

export type DaisyFieldKind = ProviderFieldKind;
export type DaisyFieldValue = ProviderFieldValue;
export type DaisyProps = ProviderProps;

export type VNode = ProviderVNode;

export interface DaisyComponentNode extends ProviderComponentNode {
  id: string;
  type: "provider";
  provider: "daisyui";
  component: string;
  props: DaisyProps;
  children?: DaisyComponentNode[];
}

export interface DaisyFieldDefinition {
  key: string;
  label: string;
  kind: DaisyFieldKind;
  default: DaisyFieldValue;
  options?: readonly string[];
  classMap?: Readonly<Record<string, string>>;
  attribute?: string;
  textContent?: boolean;
}

export interface DaisyComponentDefinition {
  id: string;
  label: string;
  category: "Actions" | "Data display" | "Feedback" | "Layout" | "Marketing" | "Navigation" | "Interactive";
  tag: string;
  rootClass: string;
  fields: readonly DaisyFieldDefinition[];
  container?: boolean;
  role?: string;
  build?: (node: DaisyComponentNode, classes: string[], children: VNode[]) => VNode;
}

export interface GeneratedDaisyComponent extends ProviderComponent<DaisyComponentNode> {
  definition: DaisyComponentDefinition;
  descriptor: {
    type: "provider";
    provider: "daisyui";
    component: string;
    name: string;
    group: "content";
    defaultTab: "content";
    fields: Array<{ key: string; kind: DaisyFieldKind; label: string; options?: Array<{ value: string; label: string }> }>;
  };
  defaults: () => Omit<DaisyComponentNode, "id">;
  build: (node: DaisyComponentNode, attrs?: Record<string, string>, children?: VNode[]) => VNode;
}

export interface ComponentProvider extends NeutralComponentProvider<DaisyComponentNode> {
  id: string;
  label: string;
  components: ReadonlyMap<string, GeneratedDaisyComponent>;
  createNode(component: string, id: string): DaisyComponentNode;
  render(node: DaisyComponentNode, attrs?: Record<string, string>, children?: VNode[]): VNode;
  cssEntryPoints: readonly string[];
}
