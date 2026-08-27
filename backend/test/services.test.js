const { test } = require('node:test')
const assert = require('node:assert')
const { yesProb } = require('../src/services/odds')
const { settle } = require('../src/services/payout')
const { brier, confidenceYes, scorePosition } = require('../src/services/calibration')

test('yesProb: empty market is 50/50', () => {
  assert.equal(yesProb(0, 0), 0.5)
})

test('yesProb: proportional to pools', () => {
  assert.equal(yesProb(75, 25), 0.75)
  assert.equal(yesProb(1, 3), 0.25)
})

test('payout: PRD example — YES pool 100, NO pool 60, resolves YES', () => {
  // one YES bettor of 100, one NO bettor of 60
  const res = settle(
    [
      { agentId: 'a', side: 'YES', amount: 100 },
      { agentId: 'b', side: 'NO', amount: 60 },
    ],
    'YES'
  )
  // a gets stake 100 + entire losing pool 60 = 160; b gets nothing
  assert.deepEqual(res, [{ agentId: 'a', payout: 160, type: 'payout' }])
})

test('payout: split proportionally among winners', () => {
  const res = settle(
    [
      { agentId: 'a', side: 'YES', amount: 30 },
      { agentId: 'b', side: 'YES', amount: 10 },
      { agentId: 'c', side: 'NO', amount: 40 },
    ],
    'YES'
  )
  const byId = Object.fromEntries(res.map((r) => [r.agentId, r.payout]))
  // winning pool 40, losing pool 40. a: 30 + 30 = 60, b: 10 + 10 = 20
  assert.equal(byId.a, 60)
  assert.equal(byId.b, 20)
  assert.equal(res.length, 2)
})

test('payout: conserves credits (no creation/destruction)', () => {
  const positions = [
    { agentId: 'a', side: 'YES', amount: 33 },
    { agentId: 'b', side: 'YES', amount: 17 },
    { agentId: 'c', side: 'NO', amount: 51 },
  ]
  const totalStaked = positions.reduce((s, p) => s + p.amount, 0)
  const res = settle(positions, 'YES')
  const paidOut = res.reduce((s, r) => s + r.payout, 0)
  // everything staked comes back out to winners; loser stakes are absorbed
  assert.equal(paidOut, totalStaked)
})

test('payout: one-sided market refunds everyone', () => {
  const res = settle(
    [
      { agentId: 'a', side: 'YES', amount: 50 },
      { agentId: 'b', side: 'YES', amount: 20 },
    ],
    'YES'
  )
  assert.deepEqual(
    res.sort((x, y) => x.agentId.localeCompare(y.agentId)),
    [
      { agentId: 'a', payout: 50, type: 'refund' },
      { agentId: 'b', payout: 20, type: 'refund' },
    ]
  )
})

test('payout: no winners refunds everyone', () => {
  const res = settle([{ agentId: 'a', side: 'NO', amount: 50 }], 'YES')
  assert.deepEqual(res, [{ agentId: 'a', payout: 50, type: 'refund' }])
})

test('calibration: confidenceYes normalises side', () => {
  assert.equal(confidenceYes('YES', 0.8), 0.8)
  assert.ok(Math.abs(confidenceYes('NO', 0.8) - 0.2) < 1e-9)
})

test('calibration: brier is 0 for a perfect confident call', () => {
  assert.equal(brier(1, 'YES'), 0)
  assert.equal(brier(0, 'NO'), 0)
})

test('calibration: brier penalises confident wrongness most', () => {
  assert.equal(brier(1, 'NO'), 1)
  assert.ok(scorePosition({ side: 'YES', confidence: 0.5 }, 'NO') === 0.25)
})
