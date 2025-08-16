import { useState } from 'react'
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const doLogin = async (e)=>{
    e.preventDefault(); setErr(''); setLoading(true)
    try{
      await setPersistence(auth, browserLocalPersistence)
      await signInWithEmailAndPassword(auth, email, pass)
      nav('/dashboard')
    }catch(ex){
      setErr(ex.message || 'Error al iniciar sesión')
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{maxWidth:420}}>
      <div className="card">
        <h2>Ingresar</h2>
        <form onSubmit={doLogin} className="flex" style={{flexDirection:'column'}}>
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
          <input placeholder="Contraseña" type="password" value={pass} onChange={e=>setPass(e.target.value)} required/>
          <button disabled={loading}>{loading? 'Entrando...' : 'Entrar'}</button>
          {err && <p style={{color:'crimson'}}>{err}</p>}
        </form>
      </div>
    </div>
  )
}
