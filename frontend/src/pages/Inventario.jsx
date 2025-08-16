import { useEffect, useState } from 'react'
import api from '../api'

export default function Inventario(){
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name:'', price:0, cost:0, stock:0, minStock:0 })
  const [loading, setLoading] = useState(true)

  const load = async()=>{
    const res = await api.get('/products'); setItems(res.data); setLoading(false)
  }
  useEffect(()=>{ load() }, [])

  const save = async(e)=>{
    e.preventDefault()
    await api.post('/products', {...form, price:+form.price, cost:+form.cost, stock:+form.stock, minStock:+form.minStock})
    setForm({ name:'', price:0, cost:0, stock:0, minStock:0 }); load()
  }

  const del = async(id)=>{ if(confirm('¿Eliminar producto?')){ await api.delete('/products/'+id); load() } }

  if(loading) return <p>Cargando...</p>

  return (
    <div className="grid-2">
      <div className="card">
        <h3>Nuevo producto</h3>
        <form onSubmit={save} className="flex" style={{flexDirection:'column'}}>
          <input placeholder="Nombre" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
          <input placeholder="Precio" type="number" step="0.01" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} required/>
          <input placeholder="Costo" type="number" step="0.01" value={form.cost} onChange={e=>setForm({...form, cost:e.target.value})} required/>
          <input placeholder="Stock" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/>
          <input placeholder="Stock mínimo" type="number" value={form.minStock} onChange={e=>setForm({...form, minStock:e.target.value})} />
          <button>Guardar</button>
        </form>
      </div>
      <div className="card">
        <h3>Productos</h3>
        <table className="table">
          <thead><tr><th>Nombre</th><th>Precio</th><th>Costo</th><th>Stock</th><th>Min</th><th></th></tr></thead>
          <tbody>
            {items.map(p=> (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>${p.price}</td>
                <td>${p.cost}</td>
                <td>{p.stock}</td>
                <td>{p.minStock}</td>
                <td><button onClick={()=>del(p.id)}>Borrar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
