const express = require('express')
const app = express()

app.use(express.json())
const authRoutes = require('./routes/auth')
app.use('/api/auth',authRoutes)

app.get('/health',(req,res)=>{
    res.status(200).json({status:"ok"})
})

module.exports = app
