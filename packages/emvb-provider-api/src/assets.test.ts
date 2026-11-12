import { describe, expect, test } from "bun:test";
import { providerStyleEntries } from "./assets.ts";
import type { ComponentProvider, ProviderComponentNode } from "./types.ts";
const provider={id:"daisyui",label:"daisyUI",nodeType:"provider",components:new Map(),createNode(){throw 0},render(){return {tag:"div",attrs:{},children:[]}},cssEntryPoints:["daisy.css"]} satisfies ComponentProvider;
const node=(providerId:string):ProviderComponentNode & {provider:string}=>({id:"x",type:"provider",provider:providerId,component:"button",props:{}});
describe("WP19 conditional CSS",()=>{ test("returns CSS only when provider is used",()=>{ expect(providerStyleEntries([], [provider])).toEqual([]); expect(providerStyleEntries([node("daisyui")],[provider])).toEqual(["daisy.css"]); expect(providerStyleEntries([node("other")],[provider])).toEqual([]); }); });
