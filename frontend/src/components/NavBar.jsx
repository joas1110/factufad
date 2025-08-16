import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

export default function NavBar(){
  const nav = useNavigate()
  const out = async ()=>{ await signOut(auth); nav('/login') }
  return (
    <header>
      <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <strong>🥖 Factufad</strong>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/ventas">Ventas</Link>
          <Link to="/compras">Compras</Link>
          <Link to="/gastos">Gastos</Link>
          <Link to="/inventario">Inventario</Link>
          <Link to="/reportes">Reportes</Link>
          <Link to="/admin">Admin</Link>
          <button onClick={out} style={{marginLeft:12}}>Salir</button>
        </nav>
      </div>
    </header>
  )
}
