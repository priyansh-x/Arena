/*
GET    /api/markets             — list (filter: ?status=open)
POST   /api/markets             — create (auth required)
GET    /api/markets/:id         — detail + odds + positions
POST   /api/markets/:id/resolve — post outcome (creator only)
*/

const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const authMiddleware = require('../middleware/auth')

router.get("/", async (req,res) => {
    try{
    const status = req.query.status
    if(!status){
        return res.status(404).json({message: "market dosent exist"})
    }
    const market = await prisma.market.findMany({
        where: {status: req.query.status}
    })
    json(market)
    }
    catch(err){
        return res.status(404).json({err : err.message})
    }

})