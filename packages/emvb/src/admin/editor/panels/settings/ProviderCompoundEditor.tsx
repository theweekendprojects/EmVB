import { Button, Input } from "@cloudflare/kumo";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { newNodeId, type LayoutNode, type ProviderNode } from "../../../../core/index.ts";
import { BUTTON, FIELD } from "../../../ui.ts";

const PARTS: Record<string, { component: string; label: string }> = {
  menu: { component: "menu-item", label: "Menu item" }, tabs: { component: "tab-item", label: "Tab" }, accordion: { component: "accordion-item", label: "Accordion item" }, table: { component: "table-row", label: "Row" }, carousel: { component: "carousel-item", label: "Slide" },
};
export function ProviderCompoundEditor({ node, onChange }: { node: LayoutNode; onChange: (node: LayoutNode) => void }) {
  if (node.type !== "provider" || node.provider !== "daisyui") return null;
  const kind = PARTS[node.component]; if (!kind) return null;
  const children = node.children ?? [];
  const changeChildren = (next: LayoutNode[]) => onChange({ ...node, children: next } as ProviderNode);
  return <section data-emvb-provider-items={node.component}><h3>{kind.label}s</h3>{children.map((child,index)=><div key={child.id} className="emvb-item-row"><Input label={`${kind.label} ${index+1}`} className={FIELD} value={String(child.props.label ?? child.props.text ?? "")} onChange={(event)=>changeChildren(children.map(item=>item.id===child.id?{...item,props:{...item.props,label:event.currentTarget.value}}:item))}/><Button className={BUTTON} aria-label={`Move ${kind.label} up`} disabled={index===0} onClick={()=>{const next=[...children];[next[index-1],next[index]]=[next[index]!,next[index-1]!];changeChildren(next)}}><ArrowUpIcon/></Button><Button className={BUTTON} aria-label={`Move ${kind.label} down`} disabled={index===children.length-1} onClick={()=>{const next=[...children];[next[index],next[index+1]]=[next[index+1]!,next[index]!];changeChildren(next)}}><ArrowDownIcon/></Button><Button className={BUTTON} aria-label={`Delete ${kind.label}`} onClick={()=>changeChildren(children.filter(item=>item.id!==child.id))}><TrashIcon/></Button></div>)}<Button className={BUTTON} onClick={()=>changeChildren([...children,{id:newNodeId(),type:"provider",provider:"daisyui",component:kind.component,props:{label:`${kind.label} ${children.length+1}`},children:[]}])}><PlusIcon/> Add {kind.label}</Button></section>;
}
