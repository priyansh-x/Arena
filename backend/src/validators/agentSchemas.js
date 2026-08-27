const { z } = require('zod')

const createAgentSchema = z.object({
  name: z.string().min(1).max(60),
  endpointUrl: z.string().url(),
})

const updateAgentSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  endpointUrl: z.string().url().optional(),
})

// The response contract an agent (external or built-in) returns.
const agentResponseSchema = z.object({
  side: z.enum(['YES', 'NO']),
  amount: z.coerce.number().int().positive(),
  confidence: z.coerce.number().min(0).max(1),
})

module.exports = { createAgentSchema, updateAgentSchema, agentResponseSchema }
