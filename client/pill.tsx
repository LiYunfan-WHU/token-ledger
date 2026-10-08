import type { PaseoAgent } from "@getpaseo/client";
import type { PluginButtonIconProps, PluginButtonRegistration, PluginClientContext } from "@getpaseo/plugin/client";
import { Icon } from "@getpaseo/plugin/client/react-native";
import { useLedger } from "./data.ts";
import { useEffect, useState } from "react";
import { subscribeAgents } from "../shared/agents.ts";
import { ledgerEnsure, type SyncResult } from "../shared/ledger.ts";
import { fmtCost, fmtTime, fmtTokens } from "./ui.tsx";

import type { PanelPlacement } from "./layout.ts";

/**
 * Compact elapsed time for the pill. The label is refreshed by the query
 * interval (3s while a turn runs), so this reads as a coarse "running 1m"
 * rather than a ticking stopwatch — enough to see that a scheduled run is
 * still going.
 */
function fmtElapsed(startedAt: string): string {
  const ms = Date.now() - Date.parse(startedAt);
  if (!Number.isFinite(ms) || ms < 0) return "–";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

/**
 * Shorter date form for compact pills: same-day keeps `done HH:MM`; a turn
 * that ended earlier shows `done 10/8` (open the ledger panel for the exact
 * time) — the full `10/8 23:48` gets ellipsized on phones.
 */
function fmtTimeCompact(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `done ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `done ${date.getMonth() + 1}/${date.getDate()}`;
}

function pillSegments({ summary, inFlight, ctx, records }: SyncResult, compact: boolean): string[] {
  const parts: string[] = [];
  // Absolute wall-clock end time, not a relative age: it stays correct without
  // a timer, so a glance after hours away still says when the last turn ended.
  // Granularity note: the ledger tracks turns, not individual tool calls.
  // FIRST in the label on purpose: narrow layouts (phones) ellipsize the tail,
  // and the timestamp is the segment you do not want to lose.
  if (inFlight) parts.push(`running ${fmtElapsed(inFlight.startedAt)}`);
  // Compact (phone) pills ellipsize, so lead with the time and keep it short:
  // "done 18:29", or "done 10/8" when it ended on another day — the date is
  // what matters there; open the ledger panel for the exact time.
  else if (records[0]) parts.push(compact ? fmtTimeCompact(records[0].endedAt) : `done ${fmtTime(records[0].endedAt)}`);
  const combinedCost = summary.effectiveCostUsd === null && inFlight?.effectiveCostUsd == null
    ? null
    : (summary.effectiveCostUsd ?? 0) + (inFlight?.effectiveCostUsd ?? 0);
  const cost = fmtCost(combinedCost);
  const estimated = summary.estimatedTurns > 0 || inFlight?.effectiveCostUsd != null;
  parts.push(cost
    ? `${estimated ? "≈" : ""}${cost}`
    : `${fmtTokens(summary.input + summary.cached + (summary.cacheWrite ?? 0) + summary.output)} tok`);
  const liveCtx = inFlight?.ctxUsed != null && inFlight.ctxMax != null
    ? { used: inFlight.ctxUsed, max: inFlight.ctxMax } : ctx;
  if (liveCtx && liveCtx.max > 0) parts.push(`ctx ${Math.round(liveCtx.used / liveCtx.max * 100)}%`);
  return parts;
}

/**
 * Compact layouts (phones) ellipsize a full joined label even after the time
 * segment moved first, so on compact the pill rotates one segment per tick —
 * everything stays readable without scrolling. Wide layouts keep the full
 * ` · ` join. Plain function (called conditionally from the component); the
 * caller owns the rotate timer.
 */
function pillLabel(data: SyncResult, compact: boolean, rotate: number): string {
  const segments = pillSegments(data, compact);
  if (!compact || segments.length <= 1) return segments.join(" · ");
  return segments[rotate % segments.length] ?? segments[0];
}

export function contributePills(client: PluginClientContext, placement: PanelPlacement): () => Promise<void> {
  let disposed = false;
  const pills = new Map<string, { workspaceId: string; handle: PluginButtonRegistration }>();
  const remove = (id: string) => {
    pills.get(id)?.handle.remove();
    pills.delete(id);
  };
  const upsert = (agent: PaseoAgent) => {
    if (disposed) return;
    const workspaceId = agent.workspaceId;
    if (!workspaceId || agent.status === "closed" || agent.archivedAt) return remove(agent.id);
    if (pills.get(agent.id)?.workspaceId === workspaceId) return;
    remove(agent.id);
    let handle: PluginButtonRegistration;
    // Only visible pills poll. The descriptor owns the label, the component
    // owns the icon and subscribes to the usage query while mounted.
    function UsageIcon(props: PluginButtonIconProps) {
      useEffect(() => placement.observe(agent.id, props.layout.compact), [props.layout.compact]);
      const { data, error } = useLedger(agent.id);
      const [rotate, setRotate] = useState(0);
      // Rotate on compact only: wide layouts show the full joined label, and
      // an unmounted icon has no timer — rotating only while visible.
      useEffect(() => {
        if (!props.layout.compact) return;
        const timer = setInterval(() => setRotate((n) => n + 1), 5000);
        return () => clearInterval(timer);
      }, [props.layout.compact]);
      useEffect(() => {
        handle.update({ label: error ? "Usage unavailable" : data ? pillLabel(data, props.layout.compact, rotate) : "…" });
      }, [data, error, props.layout.compact, rotate]);
      return <Icon name={data?.inFlight ? "Activity" : "Coins"} size={props.size} color={props.color} />;
    }
    handle = client.addComposerPill({
      id: `ledger-pill-${agent.id}`, workspaceId, agentId: agent.id,
      button: {
        title: "Open TokenLedger Session Ledger", icon: UsageIcon, label: "…",
        behavior: { kind: "action", onPress: () => client.openPanel("ledger", {
          workspaceId, agentId: agent.id, ...placement.options(agent.id),
        }) },
      },
    });
    pills.set(agent.id, { workspaceId, handle });
  };
  const subscription = subscribeAgents(client.paseo, {
    onSnapshot: (agents) => {
      if (disposed) return;
      const ids = new Set(agents.map((agent) => agent.id));
      for (const id of pills.keys()) if (!ids.has(id)) remove(id);
      for (const agent of agents) upsert(agent);
    },
    onUpdate: (update) => {
      if (update.kind === 'upsert') upsert(update.agent);
      else remove(update.agentId);
    },
    onError: (error) => console.error('token-ledger: failed to list composer agents', error),
  });
  void client.rpc(ledgerEnsure, {}).catch((error) => console.error("token-ledger: tracker startup failed", error));
  return async () => {
    disposed = true;
    for (const id of pills.keys()) remove(id);
    await subscription.release();
  };
}
