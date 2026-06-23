import { useEffect, useState } from 'react'
import { supabase, supabaseConfigurado } from './supabaseClient'
import './App.css'

// Frases de inspiración con fotos de personas famosas.
// Las fotos vienen de Wikimedia Commons (Special:FilePath siempre funciona).
const FRASES = [
  {
    texto: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
    autor: 'Nelson Mandela',
    emoji: '✊',
    foto: 'https://commons.wikimedia.org/wiki/Special:FilePath/Nelson_Mandela_1994.jpg?width=200',
  },
  {
    texto: 'La imaginación es más importante que el conocimiento.',
    autor: 'Albert Einstein',
    emoji: '🧠',
    foto: 'https://commons.wikimedia.org/wiki/Special:FilePath/Albert_Einstein_Head.jpg?width=200',
  },
  {
    texto: 'Tu tiempo es limitado, no lo gastes viviendo la vida de otro.',
    autor: 'Steve Jobs',
    emoji: '💡',
    foto: 'https://commons.wikimedia.org/wiki/Special:FilePath/Steve_Jobs_Headshot_2010-CROP_(cropped_2).jpg?width=200',
  },
  {
    texto: 'No cuentes los días, haz que los días cuenten.',
    autor: 'Muhammad Ali',
    emoji: '🥊',
    foto: 'https://commons.wikimedia.org/wiki/Special:FilePath/Muhammad_Ali_NYWTS.jpg?width=200',
  },
  {
    texto: 'Las cosas grandes nunca vienen de la zona de confort.',
    autor: 'Kobe Bryant',
    emoji: '🏀',
    foto: 'https://commons.wikimedia.org/wiki/Special:FilePath/Kobe_Bryant_2014.jpg?width=200',
  },
]

function App() {
  // Cuál frase de inspiración se muestra ahora mismo.
  const [fraseActual, setFraseActual] = useState(0)
  // Lista de tareas/recordatorios que vienen de la base de datos.
  const [tareas, setTareas] = useState([])
  // Texto que el usuario está escribiendo para una nueva tarea.
  const [titulo, setTitulo] = useState('')
  // Fecha opcional del recordatorio.
  const [fecha, setFecha] = useState('')
  // Para mostrar "Cargando..." o errores.
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Cuando la app abre, traemos las tareas guardadas.
  useEffect(() => {
    if (supabaseConfigurado) {
      cargarTareas()
    } else {
      setCargando(false)
    }
  }, [])

  // Cada 6 segundos cambiamos a la siguiente frase de inspiración.
  useEffect(() => {
    const intervalo = setInterval(() => {
      setFraseActual((i) => (i + 1) % FRASES.length)
    }, 6000)
    return () => clearInterval(intervalo)
  }, [])

  // Leer todas las tareas desde Supabase, las más nuevas primero.
  async function cargarTareas() {
    setCargando(true)
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .order('creada_en', { ascending: false })

    if (error) {
      setError('No se pudieron cargar las tareas: ' + error.message)
    } else {
      setTareas(data)
    }
    setCargando(false)
  }

  // Agregar una nueva tarea.
  async function agregarTarea(e) {
    e.preventDefault()
    if (!titulo.trim()) return

    const { data, error } = await supabase
      .from('tareas')
      .insert({ titulo: titulo.trim(), fecha: fecha || null, completada: false })
      .select()

    if (error) {
      setError('No se pudo agregar: ' + error.message)
    } else {
      setTareas([data[0], ...tareas])
      setTitulo('')
      setFecha('')
      setError('')
    }
  }

  // Marcar una tarea como completada o pendiente.
  async function alternarCompletada(tarea) {
    const { error } = await supabase
      .from('tareas')
      .update({ completada: !tarea.completada })
      .eq('id', tarea.id)

    if (error) {
      setError('No se pudo actualizar: ' + error.message)
    } else {
      setTareas(
        tareas.map((t) =>
          t.id === tarea.id ? { ...t, completada: !t.completada } : t
        )
      )
    }
  }

  // Borrar una tarea.
  async function borrarTarea(id) {
    const { error } = await supabase.from('tareas').delete().eq('id', id)
    if (error) {
      setError('No se pudo borrar: ' + error.message)
    } else {
      setTareas(tareas.filter((t) => t.id !== id))
    }
  }

  // Si Supabase aún no está configurado, mostramos instrucciones.
  if (!supabaseConfigurado) {
    return (
      <div className="contenedor">
        <h1>📝 Mis Recordatorios</h1>
        <div className="aviso">
          <p><strong>Falta conectar Supabase.</strong></p>
          <p>
            Crea un archivo <code>.env.local</code> con tus llaves de Supabase
            (mira el archivo <code>.env.example</code>) y vuelve a iniciar la app.
          </p>
        </div>
      </div>
    )
  }

  const pendientes = tareas.filter((t) => !t.completada)
  const completadas = tareas.filter((t) => t.completada)

  const frase = FRASES[fraseActual]

  return (
    <div className="contenedor">
      <div className="saludo">¿Qué pasó mi brodi? 👋</div>
      <h1>📝 Mis Recordatorios</h1>
      <p className="subtitulo">Tareas y recordatorios personales</p>

      {/* Frase de inspiración con foto, cambia sola cada 6 segundos */}
      <div className="frase" key={fraseActual}>
        <img
          className="frase-foto"
          src={frase.foto}
          alt={frase.autor}
          onError={(e) => {
            // Si la foto no carga, mostramos un emoji en su lugar.
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
        <div className="frase-emoji">{frase.emoji}</div>
        <div className="frase-texto">
          <p className="frase-cita">“{frase.texto}”</p>
          <p className="frase-autor">— {frase.autor}</p>
        </div>
      </div>

      <form onSubmit={agregarTarea} className="formulario">
        <input
          type="text"
          placeholder="¿Qué tienes que hacer?"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <button type="submit">Agregar</button>
      </form>

      {error && <p className="error">{error}</p>}
      {cargando && <p>Cargando...</p>}

      {!cargando && (
        <>
          <h2>Pendientes ({pendientes.length})</h2>
          {pendientes.length === 0 && <p className="vacio">No tienes pendientes 🎉</p>}
          <ul className="lista">
            {pendientes.map((t) => (
              <li key={t.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={t.completada}
                    onChange={() => alternarCompletada(t)}
                  />
                  <span>
                    {t.titulo}
                    {t.fecha && <em className="fecha"> — {t.fecha}</em>}
                  </span>
                </label>
                <button className="borrar" onClick={() => borrarTarea(t.id)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>

          {completadas.length > 0 && (
            <>
              <h2>Completadas ({completadas.length})</h2>
              <ul className="lista">
                {completadas.map((t) => (
                  <li key={t.id} className="hecha">
                    <label>
                      <input
                        type="checkbox"
                        checked={t.completada}
                        onChange={() => alternarCompletada(t)}
                      />
                      <span>{t.titulo}</span>
                    </label>
                    <button className="borrar" onClick={() => borrarTarea(t.id)}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default App
