import Notification from '../models/Notification.js'
import User from '../models/User.js'

function normalizeId(id) {
  return id?.toString?.() || String(id)
}

function toSocketPayload(notif) {
  return {
    _id: notif._id,
    type: notif.type,
    payload: notif.payload,
    read: notif.read ?? false,
    createdAt: notif.createdAt,
  }
}

function emitNotification(io, notif) {
  if (!io || !notif?.userId) return
  io.to(`user:${normalizeId(notif.userId)}`).emit('notification:new', toSocketPayload(notif))
}

export async function createNotification({ userId, type, payload = {}, io }) {
  if (!userId) return null
  const notif = await Notification.create({ userId, type, payload })
  emitNotification(io, notif)
  return notif
}

export async function createNotifications({ userIds = [], type, payload = {}, io }) {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map(normalizeId))]
  if (!uniqueIds.length) return []

  const notifs = await Notification.insertMany(
    uniqueIds.map((userId) => ({ userId, type, payload })),
  )

  notifs.forEach((notif) => emitNotification(io, notif))
  return notifs
}

export async function createRoleNotifications({
  roles = [],
  excludeUserIds = [],
  type,
  payload = {},
  io,
}) {
  const uniqueRoles = [...new Set(roles.filter(Boolean))]
  if (!uniqueRoles.length) return []

  const excluded = [...new Set(excludeUserIds.filter(Boolean).map(normalizeId))]
  const query = {
    role: { $in: uniqueRoles },
    suspended: { $ne: true },
  }
  if (excluded.length) query._id = { $nin: excluded }

  const users = await User.find(query).select('_id').lean()
  return createNotifications({
    userIds: users.map((user) => user._id),
    type,
    payload,
    io,
  })
}
