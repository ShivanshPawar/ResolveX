import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'

process.env.NODE_ENV = 'production'

const { default: app } = await import('./app.js')

test('production app responds at the root and health endpoints', async (t) => {
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => server.close())

  const origin = `http://127.0.0.1:${server.address().port}`
  const requestOptions = { headers: { connection: 'close' } }
  const [root, health] = await Promise.all([
    fetch(`${origin}/`, requestOptions),
    fetch(`${origin}/api/v1/health`, requestOptions),
  ])

  assert.equal(root.status, 200)
  assert.match(root.headers.get('content-type') || '', /text\/html|application\/json/)
  assert.equal(health.status, 200)
  assert.deepEqual(await health.json(), {
    success: true,
    message: 'ResolveX backend is healthy',
  })
})
