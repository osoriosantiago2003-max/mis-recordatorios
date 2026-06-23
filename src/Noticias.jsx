import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Cómo se ve y se titula cada categoría de noticias.
const CATEGORIAS = [
  { clave: 'mundo', titulo: '🌍 Mundo', desc: 'Hechos importantes alrededor del planeta' },
  { clave: 'deportes', titulo: '⚽ Deportes', desc: 'Tendencias y resultados del deporte' },
  { clave: 'trading', titulo: '📈 Bolsa & Trading', desc: 'Inversiones, acciones y cripto' },
]

function Noticias() {
  const [noticias, setNoticias] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  async function cargarNoticias() {
    setCargando(true)
    setError('')
    const { data, error } = await supabase.functions.invoke('noticias')
    if (error) {
      setError('No se pudieron cargar las noticias. Intenta de nuevo en un momento.')
    } else {
      setNoticias(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarNoticias()
  }, [])

  return (
    <div className="noticias">
      <div className="noticias-cabecera">
        <div>
          <h2 className="noticias-titulo">🌎 Noticias del día</h2>
          <p className="noticias-sub">Entérate de lo que pasa en el mundo</p>
        </div>
        <button className="noticias-refrescar" onClick={cargarNoticias} disabled={cargando}>
          {cargando ? 'Cargando…' : '🔄 Actualizar'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {cargando && !noticias && <p className="noticias-cargando">Buscando las últimas noticias…</p>}

      {noticias &&
        CATEGORIAS.map((cat) => {
          const lista = noticias[cat.clave] || []
          return (
            <div key={cat.clave} className="noticias-grupo">
              <h3 className="noticias-grupo-titulo">{cat.titulo}</h3>
              <p className="noticias-grupo-desc">{cat.desc}</p>
              {lista.length === 0 && (
                <p className="noticias-vacio">No hay noticias en este momento.</p>
              )}
              <ul className="noticias-lista">
                {lista.map((n, i) => (
                  <li key={i} className="noticia">
                    <a href={n.link} target="_blank" rel="noopener noreferrer">
                      <span className="noticia-titular">{n.titulo}</span>
                      {n.fuente && <span className="noticia-fuente">{n.fuente}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
    </div>
  )
}

export default Noticias
