import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { appEvents } from '../utils/appEvents'

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Attach JWT on every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Auto-clear token on 401 so stale sessions don't block public APIs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      const token = await AsyncStorage.getItem('auth_token')
      if (token) {
        await AsyncStorage.removeItem('auth_token')
        try {
          const { useStore } = require('../store')
          useStore.getState().setUser(null)
          useStore.getState().setCartData({ items: [], subtotal: 0, totalItems: 0 })
        } catch { }
        // Notify root layout to redirect to /auth
        appEvents.emit('session_expired', {})
      }
    }
    return Promise.reject(error)
  }
)

export default api
