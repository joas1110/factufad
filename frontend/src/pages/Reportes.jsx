import api from '../api'

export default function Reportes(){
  const dl = async (path, name) => {
    const res = await api.get(path, { responseType:'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url)
  }
  return (
    <div className="card">
      <h3>Exportaciones y backup</h3>
      <div className="flex">
        <button onClick={()=>dl('/export/csv','factufad_csv.zip')}>Exportar CSV (ZIP)</button>
        <button onClick={()=>dl('/export/excel','factufad_export.xlsx')}>Exportar Excel</button>
        <button onClick={()=>dl('/export/pdf','factufad_resumen.pdf')}>Exportar PDF (resumen)</button>
        <button onClick={()=>dl('/backup','factufad_backup.zip')}>Backup completo (ZIP)</button>
      </div>
    </div>
  )
}
