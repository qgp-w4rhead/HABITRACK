import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'
const DB_NAME = process.env.DB_NAME || 'habitrack'
const PORT = Number(process.env.PORT || 3000)

const client = new MongoClient(MONGO_URL)
await client.connect()
const db = client.db(DB_NAME)
const profiles = db.collection('profiles')
const habits = db.collection('habits')
const settings = db.collection('settings')

await profiles.createIndex({ id: 1 }, { unique: true })
await habits.createIndex({ profileId: 1, id: 1 }, { unique: true })
await habits.createIndex({ profileId: 1, serverUpdatedAt: 1 })
await settings.createIndex({ profileId: 1 }, { unique: true })

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const serverTime = () => new Date().toISOString()

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// --- Profiles -------------------------------------------------------------
// Sync model: client pushes its full local list, pulls the full server list,
// merges by updatedAt (last write wins). The set of profiles stays tiny.

app.get('/api/profiles', async (_req, res) => {
  const docs = await profiles.find({}, { projection: { _id: 0 } }).toArray()
  res.json({ profiles: docs, serverTime: serverTime() })
})

app.post('/api/profiles/push', async (req, res) => {
  const list = Array.isArray(req.body?.profiles) ? req.body.profiles : []
  const now = serverTime()
  for (const p of list) {
    if (!p?.id || typeof p.name !== 'string') continue
    const existing = await profiles.findOne({ id: p.id })
    if (existing && (existing.updatedAt ?? '') > (p.updatedAt ?? '')) continue
    const { _id, ...doc } = p
    await profiles.updateOne(
      { id: p.id },
      { $set: { ...doc, serverUpdatedAt: now } },
      { upsert: true },
    )
  }
  res.json({ ok: true, serverTime: now })
})

// --- Habits ---------------------------------------------------------------
// Docs carry client fields plus: profileId, deleted, serverUpdatedAt.
// Push applies incoming writes only when they aren't older than what is
// stored (last write wins per habit). Deletes are soft (deleted flag) so
// other devices learn about them on pull. Pull supports ?since=<ISO>
// filtering on serverUpdatedAt for incremental sync.

app.get('/api/profiles/:pid/habits', async (req, res) => {
  const { pid } = req.params
  const { since } = req.query
  const filter = { profileId: pid }
  if (typeof since === 'string' && since) filter.serverUpdatedAt = { $gt: since }
  const docs = await habits.find(filter, { projection: { _id: 0 } }).toArray()
  res.json({ habits: docs, serverTime: serverTime() })
})

app.post('/api/profiles/:pid/habits/push', async (req, res) => {
  const { pid } = req.params
  const upserts = Array.isArray(req.body?.upserts) ? req.body.upserts : []
  const deletes = Array.isArray(req.body?.deletes) ? req.body.deletes : []
  const now = serverTime()

  for (const h of upserts) {
    if (!h?.id) continue
    const existing = await habits.findOne({ profileId: pid, id: h.id })
    if (existing && (existing.updatedAt ?? '') > (h.updatedAt ?? '')) continue
    const { _id, profileId, serverUpdatedAt, deleted, ...fields } = h
    await habits.updateOne(
      { profileId: pid, id: h.id },
      { $set: { ...fields, profileId: pid, deleted: false, serverUpdatedAt: now } },
      { upsert: true },
    )
  }

  for (const id of deletes) {
    if (typeof id !== 'string') continue
    await habits.updateOne(
      { profileId: pid, id },
      { $set: { deleted: true, updatedAt: now, serverUpdatedAt: now } },
      { upsert: true },
    )
  }

  res.json({ ok: true, serverTime: now })
})

// --- Settings ---------------------------------------------------------------
// One settings doc per profile, last write wins by updatedAt. The client sends
// its copy; the server stores it only when strictly newer, then always returns
// the winning doc ; one round trip does push and pull. An empty updatedAt
// means "never modified on this device" and is never stored, so fresh installs
// can't clobber real settings with defaults.

app.post('/api/profiles/:pid/settings/sync', async (req, res) => {
  const { pid } = req.params
  const incoming = req.body?.settings ?? null
  const incomingAt = typeof req.body?.updatedAt === 'string' ? req.body.updatedAt : ''
  const now = serverTime()
  const existing = await settings.findOne({ profileId: pid })

  if (incoming && incomingAt && (!existing || incomingAt > (existing.updatedAt ?? ''))) {
    await settings.updateOne(
      { profileId: pid },
      { $set: { settings: incoming, updatedAt: incomingAt, serverUpdatedAt: now } },
      { upsert: true },
    )
    return res.json({ settings: incoming, updatedAt: incomingAt, serverTime: now })
  }

  res.json({
    settings: existing?.settings ?? null,
    updatedAt: existing?.updatedAt ?? '',
    serverTime: now,
  })
})

app.listen(PORT, () => {
  console.log(`habitrack api listening on :${PORT} (db: ${DB_NAME})`)
})
