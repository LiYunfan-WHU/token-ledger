import type { PaseoAgent, PaseoAgentUpdate, PaseoApi } from "@getpaseo/client";
import type { SessionOutboundMessage } from '@getpaseo/protocol/messages';
import { subscribeCatalog, type CatalogSubscription } from './catalog-subscription.ts';

/** A list page is not the complete catalog. Subscribe only on the first page. */
export async function listAgents(paseo: PaseoApi): Promise<PaseoAgent[]> {
  const agents = new Map<string, PaseoAgent>();
  let cursor: string | undefined;
  const seen = new Set<string>();
  do {
    const page = await paseo.agents.list({
      page: { limit: 200, ...(cursor ? { cursor } : {}) },
    });
    for (const { agent } of page.entries) agents.set(agent.id, agent);
    cursor = page.pageInfo.nextCursor ?? undefined;
    if (cursor && seen.has(cursor)) throw new Error("Repeated agent pagination cursor");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return [...agents.values()];
}

export function subscribeAgents(paseo: PaseoApi, handlers: {
  onSnapshot(agents: PaseoAgent[], restored: boolean): void;
  onUpdate(update: PaseoAgentUpdate): void;
  onError(error: unknown): void;
}): CatalogSubscription {
  return subscribeCatalog({
    open: () => paseo.agents.list({ subscribe: {}, page: { limit: 200 } }),
    next: (cursor) => paseo.agents.list({ page: { limit: 200, cursor } }),
    entries: (page) => page.entries.map(({ agent }) => agent),
    id: (agent) => agent.id,
    update: (value) => {
      const message = value as SessionOutboundMessage;
      if (message.type !== 'agent_update') return null;
      const update = message.payload;
      return update.kind === 'upsert' ? { id: update.agent.id, item: update.agent, value: update }
        : { id: update.agentId, item: null, value: update };
    },
    ...handlers,
  });
}
