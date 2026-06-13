import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('sb_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios.get(`${API}/auth/me`).then(r => setUser(r.data)).catch(() => logout()).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const r = await axios.post(`${API}/auth/login`, { email, password })
    localStorage.setItem('sb_token', r.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`
    setToken(r.data.token); setUser(r.data.user)
    return r.data
  }

  const register = async (name, email, password) => {
    const r = await axios.post(`${API}/auth/register`, { name, email, password })
    localStorage.setItem('sb_token', r.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`
    setToken(r.data.token); setUser(r.data.user)
    return r.data
  }

  const logout = () => {
    localStorage.removeItem('sb_token')
    delete axios.defaults.headers.common['Authorization']
    setToken(null); setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
export { API }
