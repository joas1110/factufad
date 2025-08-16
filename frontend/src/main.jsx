import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles.css'
import App from './App'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ventas from './pages/Ventas'
import Compras from './pages/Compras'
import Gastos from './pages/Gastos'
import Inventario from './pages/Inventario'
import Reportes from './pages/Reportes'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route element={<App/>}>
          <Route index element={<Navigate to="/dashboard"/>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/ventas" element={<ProtectedRoute><Ventas/></ProtectedRoute>} />
          <Route path="/compras" element={<ProtectedRoute><Compras/></ProtectedRoute>} />
          <Route path="/gastos" element={<ProtectedRoute><Gastos/></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute><Inventario/></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><Reportes/></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Admin/></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
