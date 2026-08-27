/*
GET    /api/agents              — public leaderboard list
POST   /api/agents              — register agent (auth required)
GET    /api/agents/:id          — agent detail + stats
PUT    /api/agents/:id          — update name/endpoint (owner only)
DELETE /api/agents/:id          — deregister (owner only)
PATCH  /api/agents/:id/toggle   — activate / deactivate
*/

const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const authMiddleware = require('../middleware/auth')
const { createAgentSchema } = require('../validators/agentSchemas')
const { ARCHETYPES, archetype } = require('../agents/archetypes')

// public: the palette of strategy archetypes for the "build an agent" flow
router.get('/archetypes', (req, res) => {
  res.json(
    Object.entries(ARCHETYPES).map(([key, a]) => ({
      key,
      name: a.name,
      emblem: a.emblem,
      blurb: a.blurb,
    }))
  )
})

router.get('/', async (req,res) => {
    try{
        const agents = await prisma.agent.findMany()
        res.json(agents)
    }
    catch(err){
        res.status(400).json({error: err.message})
    }
})

router.post('/', authMiddleware, async (req,res) => {
    try{
        const d = createAgentSchema.parse(req.body)
        const data = {
            name: d.name,
            kind: d.kind,
            userId: req.user.id,
            model: d.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
            emblem: d.emblem || (d.kind === 'hosted' ? '🤖' : '🛰️'),
            bio: d.bio || null,
        }
        if (d.kind === 'external') {
            data.endpointUrl = d.endpointUrl
        } else {
            // hosted: run by Arena from an archetype and/or a custom strategy
            const arch = d.archetype ? archetype(d.archetype) : null
            data.archetype = d.archetype || null
            data.strategy = d.strategy || (arch ? arch.blurb : null)
            data.systemPrompt =
                d.strategy || (arch ? arch.systemPrompt : null)
            if (arch && !d.emblem) data.emblem = arch.emblem
        }
        const agent = await prisma.agent.create({ data })
        res.status(201).json(agent)
    }
    catch(err){
        res.status(400).json({error: err.message})
    }
})

router.get('/:id', async (req,res) => {
    try{
        const agent_det = await prisma.agent.findUnique({
            where: { id: req.params.id}
        })
        if(!agent_det){
            return res.status(404).json({error: "agent not found"})
        }
        res.json(agent_det)
    }
    catch(err){
        res.status(400).json({error:err.message})
    }
} )

router.put("/:id", authMiddleware, async (req,res) => {
    try{
        const agent = await prisma.agent.findUnique({
            where : { id : req.params.id }
        })
        if(!agent){
            return res.status(404).json({error: "agent not found"})
        }
        if(agent.userId !== req.user.id){
            return res.status(403).json({error: "not your agent bro -_-"})
        }
        const { name, endpointUrl} = req.body
        const updated = await prisma.agent.update({
            where: { id: req.params.id},
            data: {name,endpointUrl}
        })
        res.json(updated)
    }
    catch(err){
        res.status(400).json({error: err.message})
    }
})

router.delete("/:id", authMiddleware, async(req,res)=>{
    try{
        const agent = await prisma.agent.findUnique({
            where: { id: req.params.id}
        })
        if(!agent){
            return res.status(404).json({error: "agent dosent exist"})
        }
        if(agent.userId !== req.user.id){
            return res.status(403).json({error: "not your agent brev -_-"})
        }
        const updated = await prisma.agent.delete({
            where: { id: req.params.id},
        })
        res.json(updated)
    }
    catch(err){
        res.status(400).json({error: err.message})
    }
})

router.patch("/:id/toggle", authMiddleware, async(req,res)=>{
    try{
        const agent = await prisma.agent.findUnique({
            where: {id: req.params.id}
        })
        if(!agent){
            return res.status(404).json({error: "agent not found"})
        }
        if(agent.userId !== req.user.id){
            return res.status(403).json({error: "not your agent"})
        }
        const toggled = await prisma.agent.update({
            where: {id: req.params.id}, 
            data: {active: !agent.active}
        })
        res.json(toggled)
    }
    catch(err){
        res.status(400).json({error: err.message})
    }
})


router.get('/:id/positions', async (req, res) => {
    try{
        const positions = await prisma.position.findMany({
            where: { agentId: req.params.id },
            include: { market: { select: { id: true, question: true, status: true, outcome: true } } },
            orderBy: { createdAt: 'desc' }
        })
        res.json(positions)
    }
    catch(err){
        res.status(400).json({error: err.message})
    }
})

router.get('/:id/logs', async (req, res) => {
    try{
        const logs = await prisma.log.findMany({
            where: { agentId: req.params.id },
            orderBy: { createdAt: 'desc' },
            take: 100
        })
        res.json(logs)
    }
    catch(err){
        res.status(400).json({error: err.message})
    }
})

module.exports = router