export type DaisyFieldKind = "text" | "textarea" | "number" | "select" | "boolean" | "href";
export type DaisyFieldValue = string | number | boolean;
export type DaisyProps = Record<string, DaisyFieldValue | undefined>;

export type VNode = { tag: string; attrs: Record<string, string>; children: Array<VNode | string> };

export interface DaisyComponentNode {
  id: string;
  type: "daisy";
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
  category: "Actions" | "Data display" | "Feedback" | "Layout" | "Marketing";
  tag: string;
  rootClass: string;
  fields: readonly DaisyFieldDefinition[];
  container?: boolean;
  role?: string;
  build?: (node: DaisyComponentNode, classes: string[], children: VNode[]) => VNode;
}

export interface GeneratedDaisyComponent {
  definition: DaisyComponentDefinition;
  descriptor: {
    type: "daisy";
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

export interface ComponentProvider {
  id: string;
  label: string;
  components: ReadonlyMap<string, GeneratedDaisyComponent>;
  createNode(component: string, id: string): DaisyComponentNode;
  render(node: DaisyComponentNode, attrs?: Record<string, string>, children?: VNode[]): VNode;
  cssEntryPoints: readonly string[];
}
