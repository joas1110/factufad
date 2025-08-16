import axios from 'axios'
import { getIdToken } from 'firebase/auth'
import { auth } from './firebase'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await getIdToken(user, true)
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
