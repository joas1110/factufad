import { useEffect, useState } from 'react'
import api from '../api'

export default function Ventas(){
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,16))
  const [list, setList] = useState([])

  useEffect(()=>{ (async()=>{
    const res = await api.get('/products'); setProducts(res.data)
  })() }, [])

  const addItem = (pid)=>{
    const p = products.find(x=>x.id===pid)
    if(!p) return
    const quantity = 1
    const unitPrice = Number(p.price)
    const unitCost = Number(p.cost)
    const subtotal = unitPrice * quantity
    setItems([...items, { productId:p.id, productName:p.name, quantity, unitPrice, unitCost, subtotal }])
  }

  const changeQty = (i, q)=>{
    const copy=[...items]; copy[i].quantity = +q; copy[i].subtotal = copy[i].unitPrice * copy[i].quantity; setItems(copy)
  }

  const total = items.reduce((a,b)=> a+b.subtotal, 0)

  const save = async()=>{
    const body = { date: new Date(date).toISOString(), items, total, grossProfit: 0 }
    await api.post('/sales', body)
    setItems([])
    const sales = await api.get('/sales')
    setList(sales.data)
    alert('Venta cargada')
  }

  useEffect(()=>{ (async()=>{ const s = await api.get('/sales'); setList(s.data) })() }, [])

  return (
    <div className="grid-2">
      <div className="card">
        <h3>Nueva venta</h3>
        <div className="flex">
          <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} />
          <select onChange={e=>addItem(e.target.value)}>
            <option value="">Agregar producto...</option>
            {products.map(p=> <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
          </select>
        </div>
        <table className="table">
          <thead><tr><th>Producto</th><th>Cant.</th><th>PU</th><th>Subtotal</th></tr></thead>
          <tbody>
            {items.map((it,i)=> (
              <tr key={i}>
                <td>{it.productName}</td>
                <td><input type="number" value={it.quantity} min={1} onChange={e=>changeQty(i, e.target.value)} style={{width:70}}/></td>
                <td>${it.unitPrice}</td>
                <td>${it.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <strong>Total: ${total.toFixed(2)}</strong>
          <button disabled={!items.length} onClick={save}>Guardar venta</button>
        </div>
      </div>
      <div className="card">
        <h3>Ventas recientes</h3>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Total</th><th>Items</th></tr></thead>
          <tbody>
            {list.map(s=> (
              <tr key={s.id}>
                <td>{new Date(s.date).toLocaleString()}</td>
                <td>${s.total?.toFixed ? s.total.toFixed(2) : s.total}</td>
                <td><span className="badge">{s.items?.length}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
