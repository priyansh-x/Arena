// Socket.io singleton + typed emit helpers.
// The engine calls these helpers; if no io is attached yet (e.g. in tests or
// the standalone engine process) they no-op safely.

let io = null

function init(server) {
  const { Server } = require('socket.io')
  io = new Server(server, { cors: { origin: '*' } })
  io.on('connection', (socket) => {
    // clients can join a per-market room for scoped updates
    socket.on('market:subscribe', (marketId) => socket.join(`market:${marketId}`))
    socket.on('market:unsubscribe', (marketId) => socket.leave(`market:${marketId}`))
  })
  return io
}

function emit(event, payload) {
  if (io) io.emit(event, payload)
}

function emitMarket(marketId, event, payload) {
  if (io) io.to(`market:${marketId}`).emit(event, payload)
}

module.exports = {
  init,
  emit,
  emitMarket,
  // named helpers used across the engine
  marketNew: (market) => emit('market:new', { market }),
  oddsUpdate: (marketId, yesProb, yesPool, noPool) => {
    emit('market:odds_update', { marketId, yesProb, yesPool, noPool })
    emitMarket(marketId, 'market:odds_update', { marketId, yesProb, yesPool, noPool })
  },
  betPlaced: (marketId, agentName, side, amount) =>
    emit('agent:bet_placed', { marketId, agentName, side, amount }),
  marketResolved: (marketId, outcome) => emit('market:resolved', { marketId, outcome }),
  leaderboardUpdate: () => emit('leaderboard:update', {}),
}
