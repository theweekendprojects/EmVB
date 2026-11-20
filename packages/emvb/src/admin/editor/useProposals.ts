import * as React from "react";
import {
  listProposals,
  listRequests,
  type AgentRequest,
  type PendingProposal,
} from "../proposals-api.ts";
import { ApiError, type Fetcher } from "../api.ts";

/** How often the open editor asks for new proposals (D-063: EmDash's MCP has no push). */
const POLL_MS = 5_000;

export type ProposalsState = {
  items: PendingProposal[];
  /** True once the first request answered; false while loading or after a failure. */
  ready: boolean;
  failed: boolean;
  refresh: () => void;
  /** W-931: the page's requests for agents, newest first. */
  requests: AgentRequest[];
  /** When an agent last checked for requests (any page), or null if none has yet. */
  agentSeenAt: string | null;
};

/**
 * W-930: polls the page's proposals while the tab is visible. A failed poll keeps the last list
 * and says so; the next tick retries.
 */
export function useProposals(
  fetcher: Fetcher,
  collection: string,
  id: string,
  enabled = true,
): ProposalsState {
  const [items, setItems] = React.useState<PendingProposal[]>([]);
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  const [requests, setRequests] = React.useState<AgentRequest[]>([]);
  const [agentSeenAt, setAgentSeenAt] = React.useState<string | null>(null);
  const refresh = React.useCallback(() => setTick((t) => t + 1), []);
  // A 403 means this user lacks content:edit_any on the page. That won't change while the page is
  // open, so stop polling for it instead of asking every tick. Reset when the page changes.
  const deniedFor = React.useRef<string | null>(null);
  const pageKey = `${collection}/${id}`;
  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const denied = (error: unknown) => error instanceof ApiError && error.status === 403;
    const load = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (deniedFor.current === pageKey) return;
      listRequests(fetcher, collection, id).then(
        (next) => {
          if (cancelled) return;
          setRequests((prev) => (sameRequests(prev, next.items) ? prev : next.items));
          setAgentSeenAt(next.agentSeenAt);
        },
        (error: unknown) => {
          if (denied(error)) deniedFor.current = pageKey;
        },
      );
      listProposals(fetcher, collection, id).then(
        (next) => {
          if (cancelled) return;
          setItems((prev) => (sameList(prev, next) ? prev : next));
          setReady(true);
          setFailed(false);
        },
        (error: unknown) => {
          if (denied(error)) deniedFor.current = pageKey;
          if (!cancelled) setFailed(true);
        },
      );
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [fetcher, collection, id, pageKey, tick, enabled]);
  return { items, ready, failed, refresh, requests, agentSeenAt };
}

const sameList = (a: PendingProposal[], b: PendingProposal[]) =>
  a.length === b.length && a.every((p, i) => p.id === b[i]?.id);

const sameRequests = (a: AgentRequest[], b: AgentRequest[]) =>
  a.length === b.length && a.every((r, i) => r.id === b[i]?.id && r.status === b[i]?.status);
