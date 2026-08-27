const { z } = require('zod')

const createMarketSchema = z.object({
  question: z.string().min(5),
  description: z.string().default(''),
  resolutionCriteria: z.string().min(3),
  category: z.string().optional(),
  autoResolve: z.boolean().optional(),
  // default: open now, close in 1 hour
  opensAt: z.coerce.date().optional(),
  closesAt: z.coerce.date().optional(),
})

const resolveMarketSchema = z.object({
  outcome: z.enum(['YES', 'NO']),
})

module.exports = { createMarketSchema, resolveMarketSchema }
