import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import { cleanup, mount, settle } from "../../../test/dom/mount.ts";
import type { Fetcher } from "../api.ts";
import { useProposals } from "./useProposals.ts";

afterEach(cleanup);

// A signed-in user without content:edit_any: both list routes answer 403.
let calls = 0;
const denied: Fetcher = async () => {
  calls += 1;
  return Response.json(
    { success: false, error: { code: "FORBIDDEN", message: "Not allowed." } },
    { status: 403 },
  );
};

function Probe() {
  const state = useProposals(denied, "emvb_pages", "page1");
  return (
    <div>
      <p data-failed={String(state.failed)} />
      <button type="button" onClick={state.refresh}>
        Refresh
      </button>
    </div>
  );
}

const failed = () => document.querySelector("[data-failed]")?.getAttribute("data-failed");

test("a user without edit rights is refused once, not on every poll", async () => {
  await mount(<Probe />);
  for (let i = 0; i < 10 && failed() !== "true"; i += 1)
    // oxlint-disable-next-line no-await-in-loop -- waits for the first poll to fail
    await settle();
  expect(failed()).toBe("true");
  // The first load asks for requests and proposals, and nothing more.
  expect(calls).toBe(2);
  const refresh = document.querySelector("button");
  act(() => refresh?.click());
  await settle();
  expect(calls).toBe(2);
});
