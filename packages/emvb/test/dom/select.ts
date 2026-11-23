import { act } from "react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Opens the Kumo Select in (or at) `scope` and picks the option whose value is `value`. */
export async function pickOption(scope: Element | null | undefined, value: string): Promise<void> {
  const trigger = scope?.matches('[role="combobox"]')
    ? scope
    : scope?.querySelector('[role="combobox"]');
  if (!trigger) throw new Error("No select trigger to open");
  await act(async () => {
    trigger.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    trigger.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    (trigger as HTMLElement).click();
    await wait(10);
  });
  const option = document
    .querySelector(`[role="option"] [data-emvb-option="${value}"]`)
    ?.closest<HTMLElement>('[role="option"]');
  if (!option) throw new Error(`No option with the value ${value}`);
  await act(async () => {
    option.click();
    await wait(10);
  });
  await settleSelect();
}

/**
 * Lets a picked Select finish closing. Its focus and position updates land in later timers; wait
 * for the popup to go and let those updates land inside act(), so they can't fail the next check
 * or the next test (W-1061).
 */
export async function settleSelect(): Promise<void> {
  // Keep the wait inside one act() call: updates that land while it is open are not warned about.
  await act(async () => {
    await new Promise<void>((resolve) => {
      const started = Date.now();
      const timer = setInterval(() => {
        // The popup's options can stay mounted after it closes, so the trigger is the signal.
        if (
          !document.querySelector('[role="combobox"][aria-expanded="true"]') ||
          Date.now() - started > 2000
        ) {
          clearInterval(timer);
          resolve();
        }
      }, 10);
    });
    // Focus and position updates keep arriving in short timers after the popup closes.
    await wait(500);
  });
}
