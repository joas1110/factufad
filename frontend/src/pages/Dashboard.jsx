import { useEffect, useState } from 'react'
import api from '../api'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend)

export default function Dashboard(){
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ (async()=>{
    const res = await api.get('/reports/summary?period=monthly')
    setSummary(res.data); setLoading(false)
  })() }, [])

  if(loading) return <p>Cargando...</p>

  const data = {
    labels: ['Ventas','Costo','Gastos','G.Bruta','G.Neta'],
    datasets: [{ label: 'Resumen mensual', data: [summary.ventas, summary.costo_ventas, summary.gastos, summary.ganancia_bruta, summary.ganancia_neta] }]
  }

  return (
    <div className="grid-2">
      <div className="card">
        <h3>Resumen</h3>
        <p><strong>Ventas:</strong> ${summary.ventas.toFixed(2)}</p>
        <p><strong>Costo de ventas:</strong> ${summary.costo_ventas.toFixed(2)}</p>
        <p><strong>Gastos:</strong> ${summary.gastos.toFixed(2)}</p>
        <p><strong>Ganancia bruta:</strong> ${summary.ganancia_bruta.toFixed(2)}</p>
        <p><strong>Ganancia neta:</strong> ${summary.ganancia_neta.toFixed(2)}</p>
      </div>
      <div className="card">
        <h3>Gráfico</h3>
        <Line data={data} />
      </div>
    </div>
  )
}
