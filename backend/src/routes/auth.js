const express = require('express')
const router = express.Router()
const { registerSchema, loginSchema } = require("../validators/authSchemas")
const bcrypt = require('bcrypt') 
const prisma = require("../lib/prisma")
const jwt = require('jsonwebtoken')


router.post('/register',async (req,res)=>{
    try{
        const {email,password} = registerSchema.parse(req.body)
        const passwordHash = await bcrypt.hash(password,10)
        const user = await prisma.user.create({
            data:{email,passwordHash}
        })
        res.status(201).json({id:user.id, email : user.email})
    }   
    catch(err){
        res.status(400).json({error : err.message})
    }
})

router.post('/login', async (req,res)=>{
    try{
        const {email,password} = loginSchema.parse(req.body)
        const user = await prisma.user.findUnique({
            where : {email}
        })
        if(!user){
            return res.status(401).json({message:"user dosent exist"})
        }
        const compare = await bcrypt.compare(password,user.passwordHash)
        if(!compare){
            return res.status(401).json({message:"user dosent exist"})
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({token})
    
    }   
    catch(err){
        res.status(400).json({error: err.message})
    }
})

const authMiddleware = require('../middleware/auth')
router.get('/me', authMiddleware, async (req,res)=>{
    try{
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, createdAt: true }
        })
        if(!user) return res.status(404).json({error: "user not found"})
        res.json(user)
    }
    catch(err){
        res.status(400).json({error: err.message})
    }
})

module.exports = router
