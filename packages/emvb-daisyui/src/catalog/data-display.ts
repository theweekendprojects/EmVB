import type { DaisyComponentDefinition, VNode } from "../types.ts";
import { safeHref } from "../render/href.ts";

const lines = (value: unknown, max = 50) => String(value ?? "").split(/\r?\n/).map(item => item.trim()).filter(Boolean).slice(0, max);
const clamp = (value: unknown, min: number, max: number) => Math.min(max, Math.max(min, Number(value)));

export const TABLE: DaisyComponentDefinition = {
  id:"table", label:"Table", category:"Data display", tag:"div", rootClass:"overflow-x-auto",
  fields:[
    {key:"caption",label:"Caption",kind:"text",default:"Data table"},
    {key:"headers",label:"Headers, separated by |",kind:"text",default:"Name|Role|Status"},
    {key:"rows",label:"Rows, cells separated by |",kind:"textarea",default:"Jane|Designer|Active\nJohn|Developer|Away"},
    {key:"style",label:"Style",kind:"select",default:"zebra",options:["plain","zebra","pin-rows","pin-cols"],classMap:{plain:"",zebra:"table-zebra", "pin-rows":"table-pin-rows", "pin-cols":"table-pin-cols"}},
    {key:"size",label:"Size",kind:"select",default:"md",options:["xs","sm","md","lg","xl"],classMap:{xs:"table-xs",sm:"table-sm",md:"table-md",lg:"table-lg",xl:"table-xl"}},
  ],
  build(node, classes){
    const headers=String(node.props.headers??"").split("|").map(v=>v.trim()).filter(Boolean).slice(0,12);
    const rows=lines(node.props.rows,100).map(row=>row.split("|").map(v=>v.trim()).slice(0,headers.length||12));
    return {tag:"div",attrs:{class:"overflow-x-auto"},children:[{tag:"table",attrs:{class:["table",...classes.filter(c=>c!=="overflow-x-auto")].filter(Boolean).join(" ")},children:[
      {tag:"caption",attrs:{class:"sr-only"},children:[String(node.props.caption)]},
      {tag:"thead",attrs:{},children:[{tag:"tr",attrs:{},children:headers.map(h=>({tag:"th",attrs:{scope:"col"},children:[h]}))}]},
      {tag:"tbody",attrs:{},children:rows.map(cells=>({tag:"tr",attrs:{},children:cells.map((cell,index)=>({tag:index===0?"th":"td",attrs:index===0?{scope:"row"}:{},children:[cell]}))}))},
    ]}]};
  },
};

export const TIMELINE: DaisyComponentDefinition = {
  id:"timeline",label:"Timeline",category:"Data display",tag:"ul",rootClass:"timeline",
  fields:[
    {key:"label",label:"Timeline label",kind:"text",default:"Project milestones"},
    {key:"items",label:"Items, Date|Title|Description",kind:"textarea",default:"2024|Started|Initial release\n2025|Expanded|New components"},
    {key:"direction",label:"Direction",kind:"select",default:"vertical",options:["vertical","horizontal"],classMap:{vertical:"timeline-vertical",horizontal:"timeline-horizontal"}},
  ],
  build(node,classes){return {tag:"ul",attrs:{class:classes.join(" "),"aria-label":String(node.props.label)},children:lines(node.props.items,30).map((entry,index)=>{const [date,title,description=""]=entry.split("|");return {tag:"li",attrs:{},children:[
    index?{tag:"hr",attrs:{},children:[]}:"",{tag:"div",attrs:{class:"timeline-start"},children:[date||""]},{tag:"div",attrs:{class:"timeline-middle","aria-hidden":"true"},children:["●"]},{tag:"div",attrs:{class:"timeline-end timeline-box"},children:[{tag:"strong",attrs:{},children:[title||"Milestone"]},{tag:"p",attrs:{},children:[description]}]},
  ].filter(Boolean) as Array<VNode|string>};})};},
};

export const AVATAR: DaisyComponentDefinition = {
  id:"avatar",label:"Avatar",category:"Data display",tag:"div",rootClass:"avatar",
  fields:[
    {key:"src",label:"Image URL",kind:"href",default:"/avatar.png"},{key:"alt",label:"Alternative text",kind:"text",default:"User avatar"},
    {key:"size",label:"Size",kind:"select",default:"md",options:["xs","sm","md","lg","xl"],classMap:{xs:"w-8",sm:"w-12",md:"w-16",lg:"w-24",xl:"w-32"}},
    {key:"status",label:"Status",kind:"select",default:"none",options:["none","online","offline"],classMap:{none:"",online:"avatar-online",offline:"avatar-offline"}},
    {key:"shape",label:"Shape",kind:"select",default:"round",options:["round","square"],classMap:{round:"rounded-full",square:"rounded"}},
  ],
  build(node,classes){const wrapper=classes.filter(c=>!c.startsWith("w-")&&!c.startsWith("rounded"));const image=classes.filter(c=>c.startsWith("w-")||c.startsWith("rounded"));return {tag:"div",attrs:{class:wrapper.join(" ")},children:[{tag:"div",attrs:{class:image.join(" ")},children:[{tag:"img",attrs:{src:safeHref(node.props.src),alt:String(node.props.alt),loading:"lazy"},children:[]}]}]};},
};

export const CHAT_BUBBLE: DaisyComponentDefinition = {
  id:"chat-bubble",label:"Chat Bubble",category:"Data display",tag:"article",rootClass:"chat",
  fields:[
    {key:"name",label:"Name",kind:"text",default:"Alice"},{key:"message",label:"Message",kind:"textarea",default:"Hello from EmVB!"},{key:"time",label:"Time",kind:"text",default:"12:45"},
    {key:"side",label:"Side",kind:"select",default:"start",options:["start","end"],classMap:{start:"chat-start",end:"chat-end"}},
    {key:"tone",label:"Color",kind:"select",default:"primary",options:["neutral","primary","secondary","accent","info","success","warning","error"],classMap:{neutral:"chat-bubble-neutral",primary:"chat-bubble-primary",secondary:"chat-bubble-secondary",accent:"chat-bubble-accent",info:"chat-bubble-info",success:"chat-bubble-success",warning:"chat-bubble-warning",error:"chat-bubble-error"}},
  ],
  build(node,classes){const bubble=classes.filter(c=>c.startsWith("chat-bubble-"));const root=classes.filter(c=>!c.startsWith("chat-bubble-"));return {tag:"article",attrs:{class:root.join(" ")},children:[{tag:"header",attrs:{class:"chat-header"},children:[String(node.props.name),{tag:"time",attrs:{class:"text-xs opacity-50"},children:[String(node.props.time)]}]},{tag:"div",attrs:{class:["chat-bubble",...bubble].join(" ")},children:[String(node.props.message)]}]};},
};

export const LIST: DaisyComponentDefinition = {
  id:"list",label:"List",category:"Data display",tag:"ul",rootClass:"list",
  fields:[{key:"label",label:"List label",kind:"text",default:"Items"},{key:"items",label:"Items, Title|Description|URL",kind:"textarea",default:"First|Description|/first\nSecond|Description|/second"},{key:"striped",label:"Striped",kind:"boolean",default:false,classMap:{true:"bg-base-200",false:""}}],
  build(node,classes){return {tag:"ul",attrs:{class:classes.join(" "),"aria-label":String(node.props.label)},children:lines(node.props.items,50).map(entry=>{const [title,description="",href=""]=entry.split("|");const content:VNode={tag:"div",attrs:{},children:[{tag:"strong",attrs:{},children:[title||"Item"]},{tag:"p",attrs:{class:"text-xs opacity-60"},children:[description]}]};return {tag:"li",attrs:{class:"list-row"},children:href?[{tag:"a",attrs:{href:safeHref(href),class:"contents"},children:[content]}]:[content]};})};},
};

export const STATUS: DaisyComponentDefinition = {
  id:"status",label:"Status",category:"Data display",tag:"span",rootClass:"status",
  fields:[{key:"label",label:"Accessible label",kind:"text",default:"Online"},{key:"tone",label:"Color",kind:"select",default:"success",options:["neutral","primary","secondary","accent","info","success","warning","error"],classMap:{neutral:"status-neutral",primary:"status-primary",secondary:"status-secondary",accent:"status-accent",info:"status-info",success:"status-success",warning:"status-warning",error:"status-error"}},{key:"size",label:"Size",kind:"select",default:"md",options:["xs","sm","md","lg","xl"],classMap:{xs:"status-xs",sm:"status-sm",md:"status-md",lg:"status-lg",xl:"status-xl"}},{key:"animate",label:"Pulse",kind:"boolean",default:false,classMap:{true:"animate-ping",false:""}}],
  build(node,classes){return {tag:"span",attrs:{class:classes.join(" "),role:"status","aria-label":String(node.props.label)},children:[]};},
};

export const TOOLTIP: DaisyComponentDefinition = {
  id:"tooltip",label:"Tooltip",category:"Data display",tag:"span",rootClass:"tooltip",container:true,
  fields:[{key:"tip",label:"Tooltip text",kind:"text",default:"Helpful information"},{key:"content",label:"Visible text",kind:"text",default:"Hover me"},{key:"position",label:"Position",kind:"select",default:"top",options:["top","bottom","left","right"],classMap:{top:"tooltip-top",bottom:"tooltip-bottom",left:"tooltip-left",right:"tooltip-right"}},{key:"open",label:"Open in editor",kind:"boolean",default:false,classMap:{true:"tooltip-open",false:""}}],
  build(node,classes,children){return {tag:"span",attrs:{class:classes.join(" "),"data-tip":String(node.props.tip),tabindex:"0","aria-label":String(node.props.tip)},children:[String(node.props.content),...children]};},
};

export const COUNTDOWN: DaisyComponentDefinition = {
  id:"countdown",label:"Countdown",category:"Data display",tag:"span",rootClass:"countdown font-mono",
  fields:[{key:"label",label:"Accessible label",kind:"text",default:"Time remaining"},{key:"value",label:"Value",kind:"number",default:42},{key:"max",label:"Maximum",kind:"number",default:99},{key:"suffix",label:"Suffix",kind:"text",default:" seconds"},{key:"size",label:"Size",kind:"select",default:"md",options:["sm","md","lg"],classMap:{sm:"text-xl",md:"text-3xl",lg:"text-5xl"}}],
  build(node,classes){const max=clamp(node.props.max,1,999);const value=clamp(node.props.value,0,max);return {tag:"span",attrs:{class:classes.join(" "),role:"timer","aria-label":`${node.props.label}: ${value}${node.props.suffix}`},children:[{tag:"span",attrs:{style:`--value:${value}`},children:[String(value)]},String(node.props.suffix)]};},
};

export const DATA_DISPLAY_DAISY_COMPONENTS=[TABLE,TIMELINE,AVATAR,CHAT_BUBBLE,LIST,STATUS,TOOLTIP,COUNTDOWN] as const;
