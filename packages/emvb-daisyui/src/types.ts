import type {
  ComponentProvider as NeutralComponentProvider,
  ProviderComponent,
  ProviderComponentNode,
  ProviderFieldKind,
  ProviderFieldValue,
  ProviderProps,
  ProviderVNode,
  ProviderRenderContext,
} from "@perkyzz/emvb-provider-api";

export type DaisyFieldKind = ProviderFieldKind;
export type DaisyFieldValue = ProviderFieldValue;
export type DaisyProps = ProviderProps;

export type DaisyVNode = ProviderVNode;

export interface DaisyComponentNode extends ProviderComponentNode {
  id: string;
  type: "provider";
  provider: "daisyui";
  component: string;
  props: DaisyProps;
  providerMeta?: Record<string, DaisyFieldValue>;
  children?: DaisyComponentNode[];
}

export interface DaisyFieldDefinition {
  key: string;
  label: string;
  kind: DaisyFieldKind;
  default: DaisyFieldValue;
  options?: readonly string[];
  /** Panel text for an option; unset options show their value in title case. */
  optionLabels?: Readonly<Record<string, string>>;
  classMap?: Readonly<Record<string, string>>;
  attribute?: string;
  textContent?: boolean;
}

export interface DaisyComponentDefinition {
  id: string;
  label: string;
  category:
    | "Actions"
    | "Data display"
    | "Feedback"
    | "Layout"
    | "Marketing"
    | "Navigation"
    | "Interactive";
  tag: string;
  rootClass: string;
  fields: readonly DaisyFieldDefinition[];
  container?: boolean;
  role?: string;
  /** Props computed each time a node is created, on top of the fields' static defaults. */
  initial?: () => DaisyProps;
  build?: (
    node: DaisyComponentNode,
    classes: string[],
    children: DaisyVNode[],
    options?: DaisyRenderOptions,
  ) => DaisyVNode;
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
    category?: string;
    /** True when the component holds child elements (see ProviderComponentDescriptor). */
    container?: boolean;
    support?: "verified" | "experimental";
    icon?: string;
    keywords?: readonly string[];
    order?: number;
    fields: Array<{
      key: string;
      kind: DaisyFieldKind;
      label: string;
      options?: Array<{ value: string; label: string }>;
    }>;
  };
  defaults: () => Omit<DaisyComponentNode, "id">;
  build: (
    node: DaisyComponentNode,
    attrs?: Record<string, string>,
    children?: DaisyVNode[],
    options?: DaisyRenderOptions,
  ) => DaisyVNode;
}

export interface ComponentProvider extends NeutralComponentProvider<DaisyComponentNode> {
  id: string;
  label: string;
  components: ReadonlyMap<string, GeneratedDaisyComponent>;
  createNode(component: string, id: string): DaisyComponentNode;
  render(
    node: DaisyComponentNode,
    attrs?: Record<string, string>,
    children?: DaisyVNode[],
    context?: ProviderRenderContext,
  ): DaisyVNode;
  cssEntryPoints: readonly string[];
}

/** Render options: only the editor canvas differs from the public page. */
export type DaisyRenderOptions = { mode?: "editor" | "public" };
