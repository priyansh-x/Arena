require('dotenv').config()
const http = require('http')
const app = require('./app')
const socket = require('./lib/socket')

const PORT = process.env.PORT || 4000

const server = http.createServer(app)
socket.init(server)

server.listen(PORT, () => {
  console.log(`API + Socket.io running on port ${PORT}`)

  // run the market engine inside the API process unless disabled
  if (process.env.ENGINE_INLINE !== 'false') {
    require('./engine').start()
    console.log('[engine] running inline')
  }
})
