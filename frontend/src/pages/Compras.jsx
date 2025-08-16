import { useEffect, useState } from 'react'
import api from '../api'

export default function Compras(){
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,16))
  const [supplier, setSupplier] = useState('')
  const [list, setList] = useState([])

  useEffect(()=>{ (async()=>{ setProducts((await api.get('/products')).data); setList((await api.get('/purchases')).data) })() }, [])

  const addItem = (pid)=>{
    const p = products.find(x=>x.id===pid)
    if(!p) return
    const quantity = 1
    const unitCost = Number(p.cost)
    const subtotal = unitCost * quantity
    setItems([...items, { productId:p.id, quantity, unitCost, subtotal }])
  }

  const changeQty = (i, q)=>{ const copy=[...items]; copy[i].quantity=+q; copy[i].subtotal=copy[i].unitCost*copy[i].quantity; setItems(copy) }

  const total = items.reduce((a,b)=> a+b.subtotal, 0)

  const save = async()=>{
    const body = { date: new Date(date).toISOString(), supplier, items, total }
    await api.post('/purchases', body)
    setItems([]); setSupplier('')
    setList((await api.get('/purchases')).data)
    alert('Compra cargada')
  }

  return (
    <div className="grid-2">
      <div className="card">
        <h3>Nueva compra de insumos</h3>
        <div className="flex">
          <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} />
          <input placeholder="Proveedor" value={supplier} onChange={e=>setSupplier(e.target.value)} />
          <select onChange={e=>addItem(e.target.value)}>
            <option value="">Agregar producto...</option>
            {products.map(p=> <option key={p.id} value={p.id}>{p.name} (stock:{p.stock})</option>)}
          </select>
        </div>
        <table className="table">
          <thead><tr><th>Producto</th><th>Cant.</th><th>Costo</th><th>Subtotal</th></tr></thead>
          <tbody>
            {items.map((it,i)=> (
              <tr key={i}>
                <td>{products.find(p=>p.id===it.productId)?.name}</td>
                <td><input type="number" value={it.quantity} min={1} onChange={e=>changeQty(i, e.target.value)} style={{width:70}}/></td>
                <td>${it.unitCost}</td>
                <td>${it.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <strong>Total: ${total.toFixed(2)}</strong>
          <button disabled={!items.length || !supplier} onClick={save}>Guardar compra</button>
        </div>
      </div>
      <div className="card">
        <h3>Compras recientes</h3>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Proveedor</th><th>Total</th></tr></thead>
          <tbody>
            {list.map(s=> (
              <tr key={s.id}>
                <td>{new Date(s.date).toLocaleString()}</td>
                <td>{s.supplier}</td>
                <td>${s.total?.toFixed ? s.total.toFixed(2) : s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
