import { Outlet, useLocation } from 'react-router-dom'
import NavBar from './components/NavBar'

export default function App(){
  const loc = useLocation()
  const noNav = loc.pathname.startsWith('/login')
  return (
    <>
      {!noNav && <NavBar/>}
      <div className="container"><Outlet/></div>
    </>
  )
}
