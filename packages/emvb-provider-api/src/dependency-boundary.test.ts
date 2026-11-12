import { describe, expect, test } from "bun:test";
import emvbPackage from "../../emvb/package.json";
import daisyPackage from "../../emvb-daisyui/package.json";
import apiPackage from "../package.json";

describe("provider dependency boundary", () => {
  test("the neutral API has no runtime dependencies", () => {
    expect(apiPackage.dependencies).toBeUndefined();
    expect(apiPackage.peerDependencies).toBeUndefined();
  });
  test("both packages share contracts through provider-api", () => {
    expect(emvbPackage.dependencies["@perkyzz/emvb-provider-api"]).toBe("workspace:*");
    expect(daisyPackage.dependencies["@perkyzz/emvb-provider-api"]).toBe("workspace:*");
    expect(daisyPackage.peerDependencies["@perkyzz/emvb"]).toBeUndefined();
    expect(daisyPackage.devDependencies["@perkyzz/emvb"]).toBeUndefined();
  });
});
