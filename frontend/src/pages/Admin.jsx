import { useState } from 'react'
import api from '../api'

export default function Admin(){
  const [uid, setUid] = useState('')
  const [role, setRole] = useState('operator')

  const setUserRole = async()=>{
    if(!uid) return
    await api.post(`/admin/users/${uid}/role/${role}`)
    alert('Rol actualizado')
  }

  return (
    <div className="card" style={{maxWidth:520}}>
      <h3>Administración</h3>
      <p>Asigna rol a un usuario por UID (lo ves en Firebase Authentication).</p>
      <input placeholder="UID de usuario" value={uid} onChange={e=>setUid(e.target.value)} />
      <select value={role} onChange={e=>setRole(e.target.value)}>
        <option value="operator">Operador</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={setUserRole}>Guardar rol</button>
    </div>
  )
}
