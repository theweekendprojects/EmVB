import { describe, expect, test } from "bun:test";
import apiPackage from "../package.json";
import daisyPackage from "../../emvb-daisyui/package.json";

describe("R8 provider package exports", () => {
  test("runtime exports point to built JavaScript", () => {
    expect(apiPackage.exports["."].import).toBe("./dist/index.js");
    expect(daisyPackage.exports["."].import).toBe("./dist/index.js");
    expect(daisyPackage.exports["./catalog"].import).toBe("./dist/catalog/index.js");
    expect(daisyPackage.exports["./styles.css"]).toBe("./dist/styles.css");
  });
  test("packages include dist and declaration sources", () => {
    expect(apiPackage.files).toContain("dist");
    expect(daisyPackage.files).toContain("dist");
    expect(apiPackage.exports["."].types).toBe("./dist/index.d.ts");
    expect(daisyPackage.exports["."].types).toBe("./dist/index.d.ts");
  });
});
