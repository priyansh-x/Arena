const { z } = require('zod')

// Create either an external (webhook) agent or a hosted (Arena-run) agent.
const createAgentSchema = z
  .object({
    name: z.string().min(1).max(60),
    kind: z.enum(['external', 'hosted']).default('external'),
    endpointUrl: z.string().url().optional(),
    archetype: z.string().max(40).optional(),
    strategy: z.string().max(2000).optional(),
    model: z.string().max(60).optional(),
    emblem: z.string().max(8).optional(),
    bio: z.string().max(200).optional(),
  })
  .refine((d) => (d.kind === 'external' ? !!d.endpointUrl : true), {
    message: 'external agents need an endpointUrl',
    path: ['endpointUrl'],
  })
  .refine((d) => (d.kind === 'hosted' ? !!(d.archetype || d.strategy) : true), {
    message: 'hosted agents need an archetype or a strategy',
    path: ['strategy'],
  })

const updateAgentSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  endpointUrl: z.string().url().optional(),
  strategy: z.string().max(2000).optional(),
  bio: z.string().max(200).optional(),
  emblem: z.string().max(8).optional(),
})

// The response contract an agent (external or built-in) returns.
const agentResponseSchema = z.object({
  side: z.enum(['YES', 'NO']),
  amount: z.coerce.number().int().positive(),
  confidence: z.coerce.number().min(0).max(1),
  thesis: z.string().max(280).optional(),
})

module.exports = { createAgentSchema, updateAgentSchema, agentResponseSchema }
