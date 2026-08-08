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
        const { name, endpointUrl } = req.body
        const agent = await prisma.agent.create({
            data : {
                name,
                endpointUrl,
                userId : req.user.id
            }
        })
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
module.exports = router