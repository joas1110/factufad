import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { Navigate } from 'react-router-dom'
import { auth } from '../firebase'
import api from '../api'

export default function ProtectedRoute({ children, adminOnly }){
  const [loading, setLoading] = useState(true)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if(!u){ setOk(false); setLoading(false); return }
      try{
        const token = await u.getIdToken(true)
        console.log('[DEBUG] token:', token?.slice(0,24))
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        console.log('[DEBUG] /auth/me status:', res.status)
        const role = res.data?.role || 'operator'
        if (adminOnly && role !== 'admin') setOk(false)
        else setOk(true)
      }catch(e){
        console.error('auth/me falló:', e)
        setOk(false)
      }finally{
        setLoading(false)
      }
    })
    return () => unsub()
  }, [adminOnly])

  if(loading) return <div className="container"><p>Cargando...</p></div>
  if(!ok) return <Navigate to="/login"/>
  return children
}
