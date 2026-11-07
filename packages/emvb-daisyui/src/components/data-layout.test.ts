import { describe, expect, test } from "bun:test";
import { DATA_DISPLAY_DAISY_COMPONENTS } from "../catalog/data-display.ts";
import { LAYOUT_MARKETING_DAISY_COMPONENTS } from "../catalog/layout-marketing.ts";
import { daisyUIProvider } from "../provider.ts";
import type { VNode } from "../types.ts";
const render=(component:string,props:Record<string,string|number|boolean>,children:VNode[]=[])=>daisyUIProvider.render({id:`x-${component}`,type:"daisy",component,props},{},children);
const walk=(node:VNode):VNode[]=>[node,...node.children.flatMap(child=>typeof child==="string"?[]:walk(child))];

describe("WP8 data display",()=>{
 test("adds eight components",()=>expect(DATA_DISPLAY_DAISY_COMPONENTS.map(x=>x.id)).toEqual(["table","timeline","avatar","chat-bubble","list","status","tooltip","countdown"]));
 test("table is accessible and bounded",()=>{const rows=Array.from({length:150},(_,i)=>`Name ${i}|Role|Active`).join("\n");const table=render("table",{caption:"People",headers:"Name|Role|Status",rows,style:"zebra",size:"md"});expect(walk(table).find(x=>x.tag==="caption")?.children).toEqual(["People"]);expect(walk(table).filter(x=>x.tag==="tr")).toHaveLength(101);expect(walk(table).filter(x=>x.attrs.scope==="col")).toHaveLength(3);});
 test("images sanitize URLs and retain alt text",()=>{const avatar=render("avatar",{src:"javascript:alert(1)",alt:"Jane Doe",size:"md",status:"online",shape:"round"});const img=walk(avatar).find(x=>x.tag==="img");expect(img?.attrs.src).toBe("#");expect(img?.attrs.alt).toBe("Jane Doe");});
 test("lists reject executable URLs",()=>{const list=render("list",{label:"Links",items:"Bad|Unsafe|javascript:alert(1)\nGood|Safe|/safe",striped:false});expect(walk(list).filter(x=>x.tag==="a").map(x=>x.attrs.href)).toEqual(["#","/safe"]);});
 test("status tooltip and countdown expose accessible semantics",()=>{expect(render("status",{label:"Online",tone:"success",size:"md",animate:false}).attrs.role).toBe("status");expect(render("tooltip",{tip:"More details",content:"Info",position:"top",open:false}).attrs.tabindex).toBe("0");const countdown=render("countdown",{label:"Remaining",value:999,max:60,suffix:" seconds",size:"md"});expect(countdown.attrs.role).toBe("timer");expect(countdown.attrs["aria-label"]).toContain("60");});
 test("class injection through options is ignored",()=>expect(render("chat-bubble",{name:"A",message:"B",time:"now",side:"fixed",tone:"[color:red]"}).attrs.class).toBe("chat"));
});

describe("WP9 layout and marketing",()=>{
 test("adds nine components",()=>expect(LAYOUT_MARKETING_DAISY_COMPONENTS.map(x=>x.id)).toEqual(["hero","stack","divider","join","indicator","mask","browser-mockup","phone-mockup","code-mockup"]));
 test("hero and mask sanitize URLs",()=>{expect(walk(render("hero",{title:"Hello",body:"World",action:"Go",href:"javascript:alert(1)",height:"md",align:"center"})).find(x=>x.tag==="a")?.attrs.href).toBe("#");expect(render("mask",{src:"data:text/html,x",alt:"Portrait",shape:"circle",size:"md"}).attrs.src).toBe("#");});
 test("join preserves children without mutating originals",()=>{const child:VNode={tag:"button",attrs:{class:"btn"},children:["A"]};const joined=render("join",{label:"Actions",direction:"horizontal"},[child]);expect((joined.children[0] as VNode).attrs.class).toBe("btn join-item");expect(child.attrs.class).toBe("btn");expect(joined.attrs.role).toBe("group");});
 test("stack caps generated layers",()=>expect(render("stack",{label:"Cards",count:999,size:"md"}).children).toHaveLength(6));
 test("mockups keep code and content as text VNodes",()=>{const code=render("code-mockup",{code:"<script>alert(1)</script>",prefix:"$",tone:"neutral"});expect(walk(code).find(x=>x.tag==="code")?.children).toEqual(["<script>alert(1)</script>"]);});
 test("semantic JSON does not persist generated classes",()=>{const original={id:"hero1",type:"daisy" as const,component:"hero",props:{title:"Hello",body:"World",action:"Go",href:"/go",height:"lg",align:"center"}};expect(JSON.stringify(original)).not.toContain("min-h-[32rem]");expect(daisyUIProvider.render(original).attrs.class).toContain("min-h-[32rem]");});
 test("invalid option values cannot inject classes",()=>expect(render("divider",{label:"OR",direction:"fixed top-0",tone:"[color:red]"}).attrs.class).toBe("divider"));
});
