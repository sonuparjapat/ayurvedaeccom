const pool = require('../config/db')

/* Save FCM / Expo push token for a user */
exports.savePushToken = async (userId, token, deviceType = 'mobile') => {
  try {
    await pool.query(
      `INSERT INTO push_tokens (user_id, token, device_type)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, token) DO UPDATE SET device_type=$3`,
      [userId, token, deviceType]
    )
  } catch (err) {
    console.error('savePushToken error:', err.message)
  }
}

/* Send Expo Push Notification to a single token */
const sendExpoNotification = async (token, title, body, data = {}) => {
  try {
    const fetch = require('node-fetch')
    const msg = {
      to: token,
      sound: 'default',
      title,
      body,
      data,
      channelId: 'default',
      priority: 'high',
      _displayInForeground: true,
    }
    const r = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(msg),
    })
    return await r.json()
  } catch (err) {
    console.error('Expo push error:', err.message)
    return null
  }
}

/* Send to all tokens of a user */
exports.sendToUser = async (userId, title, body, data = {}) => {
  try {
    const res = await pool.query('SELECT token FROM push_tokens WHERE user_id=$1', [userId])
    await Promise.allSettled(res.rows.map(r => sendExpoNotification(r.token, title, body, data)))
  } catch (err) {
    console.error('sendToUser push error:', err.message)
  }
}

/* Broadcast to all users (admin) */
exports.broadcastAll = async (title, body, data = {}) => {
  try {
    const res = await pool.query('SELECT DISTINCT token FROM push_tokens')
    const chunks = []
    for (let i = 0; i < res.rows.length; i += 100) {
      chunks.push(res.rows.slice(i, i + 100))
    }
    for (const chunk of chunks) {
      await Promise.allSettled(chunk.map(r => sendExpoNotification(r.token, title, body, data)))
    }
    return { sent: res.rows.length }
  } catch (err) {
    console.error('broadcastAll push error:', err.message)
    return { sent: 0 }
  }
}

/* Broadcast to segment (e.g. users who haven't ordered in 30 days) */
exports.broadcastSegment = async (userIds, title, body, data = {}) => {
  try {
    const res = await pool.query(
      'SELECT token FROM push_tokens WHERE user_id = ANY($1)',
      [userIds]
    )
    await Promise.allSettled(res.rows.map(r => sendExpoNotification(r.token, title, body, data)))
    return { sent: res.rows.length }
  } catch (err) {
    console.error('broadcastSegment error:', err.message)
    return { sent: 0 }
  }
}
