import { useEffect, useState } from 'react'
import api from '../api'

export default function Gastos(){
  const [list, setList] = useState([])
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,16), category:'fijo', subcategory:'', description:'', amount:0 })

  const load = async()=>{ setList((await api.get('/expenses')).data) }
  useEffect(()=>{ load() }, [])

  const save = async()=>{
    const body = { ...form, date: new Date(form.date).toISOString(), amount: +form.amount }
    await api.post('/expenses', body)
    setForm({ date: new Date().toISOString().slice(0,16), category:'fijo', subcategory:'', description:'', amount:0 })
    load()
  }

  return (
    <div className="grid-2">
      <div className="card">
        <h3>Nuevo gasto</h3>
        <div className="flex" style={{flexDirection:'column'}}>
          <input type="datetime-local" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
          <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
            <option value="fijo">Fijo (luz, gas)</option>
            <option value="variable">Variable</option>
          </select>
          <input placeholder="Subcategoría" value={form.subcategory} onChange={e=>setForm({...form, subcategory:e.target.value})} />
          <input placeholder="Descripción" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          <input placeholder="Monto" type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
          <button onClick={save}>Guardar gasto</button>
        </div>
      </div>
      <div className="card">
        <h3>Gastos recientes</h3>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Categoría</th><th>Monto</th><th>Detalle</th></tr></thead>
          <tbody>
            {list.map(g=> (
              <tr key={g.id}>
                <td>{new Date(g.date).toLocaleString()}</td>
                <td>{g.category} {g.subcategory? `(${g.subcategory})`:''}</td>
                <td>${g.amount}</td>
                <td>{g.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
