import type { DaisyComponentNode, DaisyProps } from "../types.ts";

export type CompoundRootId = "menu" | "tabs" | "accordion" | "table" | "carousel";
export interface CompoundConfig { part: string; label: string; richContent: boolean; fields: readonly string[]; }
export const COMPOUND_CONFIG: Readonly<Record<CompoundRootId, CompoundConfig>> = {
  menu: { part: "menu-item", label: "Menu item", richContent: false, fields: ["label", "href", "disabled"] },
  tabs: { part: "tab-item", label: "Tab", richContent: true, fields: ["label", "selected"] },
  accordion: { part: "accordion-item", label: "Accordion item", richContent: true, fields: ["label", "defaultOpen"] },
  table: { part: "table-row", label: "Row", richContent: true, fields: [] },
  carousel: { part: "carousel-item", label: "Slide", richContent: true, fields: ["label"] },
};
export const compoundConfig = (component: string): CompoundConfig | undefined => COMPOUND_CONFIG[component as CompoundRootId];
export const compoundPartFor = (component: string): string | undefined => compoundConfig(component)?.part;
export const supportsCompoundEditor = (component: string): component is CompoundRootId => component in COMPOUND_CONFIG;

const defaultsFor = (part: string): DaisyProps => part === "menu-item" ? { label: "Item", href: "#", disabled: false } : part === "tab-item" ? { label: "Tab", selected: false } : part === "accordion-item" ? { label: "Question", defaultOpen: false } : part === "carousel-item" ? { label: "Slide" } : {};
export function addCompoundItem(parent: DaisyComponentNode, id: string, props: DaisyProps = {}): DaisyComponentNode {
  const component = compoundPartFor(parent.component); if (!component) return parent;
  return { ...parent, children: [...(parent.children ?? []), { id, type: "provider", provider: "daisyui", component, props: { ...defaultsFor(component), ...props }, children: [] }] };
}
export function duplicateCompoundItem(parent: DaisyComponentNode, id: string, newId: () => string): DaisyComponentNode {
  const children = [...(parent.children ?? [])]; const index = children.findIndex((child) => child.id === id); if (index < 0) return parent;
  const clone = (node: DaisyComponentNode): DaisyComponentNode => ({ ...node, id: newId(), children: node.children?.map(clone) });
  children.splice(index + 1, 0, clone(children[index]!)); return { ...parent, children };
}
export function removeCompoundItem(parent: DaisyComponentNode, id: string): DaisyComponentNode { return { ...parent, children: (parent.children ?? []).filter((child) => child.id !== id) }; }
export function moveCompoundItem(parent: DaisyComponentNode, id: string, delta: -1 | 1): DaisyComponentNode { const children=[...(parent.children??[])]; const from=children.findIndex((child)=>child.id===id); const to=from+delta; if(from<0||to<0||to>=children.length)return parent; [children[from],children[to]]=[children[to]!,children[from]!]; return {...parent,children}; }
export function moveCompoundItemTo(parent: DaisyComponentNode, id: string, targetId: string): DaisyComponentNode { const children=[...(parent.children??[])]; const from=children.findIndex((child)=>child.id===id); const to=children.findIndex((child)=>child.id===targetId); if(from<0||to<0||from===to)return parent; const [item]=children.splice(from,1); children.splice(to,0,item!); return {...parent,children}; }
export function updateCompoundItem(parent: DaisyComponentNode, id: string, props: DaisyProps): DaisyComponentNode { return { ...parent, children: (parent.children ?? []).map((child) => child.id === id ? { ...child, props: { ...child.props, ...props } } : child) }; }
export function updateCompoundItemChildren(parent: DaisyComponentNode, id: string, children: DaisyComponentNode[]): DaisyComponentNode { return { ...parent, children: (parent.children ?? []).map((child)=>child.id===id?{...child,children}:child) }; }

export interface CompoundIssue { nodeId: string; code: "wrong-part" | "duplicate-id" | "tab-selection" | "empty-table-row"; message: string; }
export function validateCompoundTree(parent: DaisyComponentNode): CompoundIssue[] {
  const config=compoundConfig(parent.component); if(!config)return []; const issues:CompoundIssue[]=[]; const ids=new Set<string>(); let selected=0;
  for(const child of parent.children??[]){ if(ids.has(child.id))issues.push({nodeId:child.id,code:"duplicate-id",message:`Duplicate item id ${child.id}.`}); ids.add(child.id); if(child.component!==config.part)issues.push({nodeId:child.id,code:"wrong-part",message:`${parent.component} accepts ${config.part} children, not ${child.component}.`}); if(parent.component==="tabs"&&child.props.selected===true)selected++; if(parent.component==="table"&&(child.children?.length??0)===0)issues.push({nodeId:child.id,code:"empty-table-row",message:"Table rows require cells."}); }
  if(parent.component==="tabs"&&(parent.children?.length??0)>0&&selected!==1)issues.push({nodeId:parent.id,code:"tab-selection",message:"Tabs require exactly one selected item."}); return issues;
}

export function addTableColumn(table: DaisyComponentNode, id: () => string, heading = "Column"): DaisyComponentNode {
  if(table.component!=="table")return table; const children=[...(table.children??[])]; let head=children.find((child)=>child.component==="table-head"); let body=children.find((child)=>child.component==="table-body");
  if(!head){head={id:id(),type:"provider",provider:"daisyui",component:"table-head",props:{},children:[{id:id(),type:"provider",provider:"daisyui",component:"table-row",props:{},children:[]}]};children.unshift(head);}
  if(!body){body={id:id(),type:"provider",provider:"daisyui",component:"table-body",props:{},children:[]};children.push(body);}
  const headerRow=head.children?.[0]!; headerRow.children=[...(headerRow.children??[]),{id:id(),type:"provider",provider:"daisyui",component:"table-header-cell",props:{text:heading,scope:"col"}}];
  for(const row of body.children??[])row.children=[...(row.children??[]),{id:id(),type:"provider",provider:"daisyui",component:"table-cell",props:{text:"Cell"}}]; return {...table,children};
}
export function addTableRow(table:DaisyComponentNode,id:()=>string):DaisyComponentNode { if(table.component!=="table")return table; const children=[...(table.children??[])]; const head=children.find((child)=>child.component==="table-head"); let body=children.find((child)=>child.component==="table-body"); if(!body){body={id:id(),type:"provider",provider:"daisyui",component:"table-body",props:{},children:[]};children.push(body);} const count=head?.children?.[0]?.children?.length??1; const row:DaisyComponentNode={id:id(),type:"provider",provider:"daisyui",component:"table-row",props:{},children:Array.from({length:count},()=>({id:id(),type:"provider",provider:"daisyui",component:"table-cell",props:{text:"Cell"}}))}; body.children=[...(body.children??[]),row]; return {...table,children}; }
