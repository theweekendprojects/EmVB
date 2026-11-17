import { must } from "../test-support.ts";
import { describe, expect, test } from "bun:test";
import {
  addCompoundItem,
  addTableColumn,
  addTableRow,
  duplicateCompoundItem,
  moveCompoundItemTo,
  updateCompoundItem,
  validateCompoundTree,
} from "../compound/editor.ts";
import { migrateLegacyItems, renderCompoundNode } from "../compound/index.ts";
import type { DaisyComponentNode } from "../types.ts";
const root = (component: string): DaisyComponentNode => ({
  id: `${component}-root`,
  type: "provider",
  provider: "daisyui",
  component,
  props: {},
  children: [],
});
const ids = () => {
  let value = 0;
  return () => `id-${++value}`;
};
describe("WP22 complete compound editing", () => {
  test("menu edits URL duplicates and drag-reorders typed items", () => {
    let m = addCompoundItem(root("menu"), "a", { label: "Home", href: "/" });
    m = addCompoundItem(m, "b", { label: "About", href: "/about" });
    m = updateCompoundItem(m, "b", { href: "/company" });
    m = duplicateCompoundItem(m, "b", ids());
    m = moveCompoundItemTo(m, must(m.children?.[2], "third item").id, "a");
    expect(m.children?.map((x) => x.props.href)).toEqual(["/company", "/", "/company"]);
  });
  test("tabs enforce exactly one selected item and preserve rich children", () => {
    let t = addCompoundItem(root("tabs"), "one", { label: "One", selected: true });
    t = addCompoundItem(t, "two", { label: "Two", selected: false });
    must(t.children?.[0], "first tab").children = [
      {
        id: "rich",
        type: "provider",
        provider: "daisyui",
        component: "card",
        props: { title: "Rich" },
      },
    ];
    expect(validateCompoundTree(t)).toEqual([]);
    must(t.children?.[1], "second tab").props.selected = true;
    expect(validateCompoundTree(t)[0]?.code).toBe("tab-selection");
    expect(t.children?.[0]?.children?.[0]?.component).toBe("card");
  });
  test("accordion exposes authored initial state", () => {
    const a = addCompoundItem(root("accordion"), "q", { label: "Question", defaultOpen: true });
    const vnode = renderCompoundNode(must(a.children?.[0], "question"));
    expect(vnode.tag).toBe("details");
    expect(vnode.attrs.open).toBe("");
  });
  test("table columns update headers and all body rows", () => {
    const id = ids();
    let table = addTableColumn(root("table"), id, "Name");
    table = addTableRow(table, id);
    table = addTableColumn(table, id, "Role");
    const head = must(
      table.children?.find((x) => x.component === "table-head"),
      "table head",
    );
    const body = must(
      table.children?.find((x) => x.component === "table-body"),
      "table body",
    );
    expect(head.children?.[0]?.children).toHaveLength(2);
    expect(body.children?.[0]?.children).toHaveLength(2);
  });
  test("legacy line migration is deterministic and idempotent", () => {
    const id = ids();
    const legacy = { ...root("menu"), props: { items: "Home|/\nAbout|/about" } };
    const migrated = migrateLegacyItems(legacy, id);
    expect(migrated.children?.map((x) => x.id)).toEqual(["id-1", "id-2"]);
    expect(migrateLegacyItems(migrated, id)).toEqual(migrated);
  });
});
