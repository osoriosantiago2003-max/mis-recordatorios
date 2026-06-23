// ============================================================
//  Función "noticias" (corre en Supabase).
//  La app la llama para mostrar las noticias del día en la
//  ventanilla de Noticias. Trae titulares de Google Noticias
//  (en español) de varias categorías, sin necesidad de API
//  de pago ni llaves.
//
//  Devuelve algo como:
//    { mundo: [...], deportes: [...], trading: [...] }
//  donde cada noticia es { titulo, fuente, link, fecha }.
// ============================================================

// Permisos para que la app (navegador) pueda llamar a esta función.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Los feeds (fuentes) de cada categoría, todos de Google Noticias en español.
const FEEDS: Record<string, string> = {
  mundo:
    'https://news.google.com/rss/headlines/section/topic/WORLD?hl=es-419&gl=CO&ceid=CO:es-419',
  deportes:
    'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=es-419&gl=CO&ceid=CO:es-419',
  trading:
    'https://news.google.com/rss/search?q=bolsa%20OR%20trading%20OR%20inversiones%20OR%20acciones%20OR%20criptomonedas&hl=es-419&gl=CO&ceid=CO:es-419',
}

// Saca el contenido de una etiqueta XML, limpiando los CDATA.
function sacarTag(bloque: string, nombre: string): string {
  const m = bloque.match(new RegExp(`<${nombre}[^>]*>([\\s\\S]*?)</${nombre}>`))
  if (!m) return ''
  return m[1]
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '') // quita cualquier etiqueta HTML que sobre
    .trim()
}

// Convierte el XML de un feed en una lista de noticias (máx. 8).
function parsearFeed(xml: string) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
  return items.slice(0, 8).map((m) => {
    const bloque = m[1]
    // Google pone el título como "Titular - Fuente"; lo separamos.
    const tituloCompleto = sacarTag(bloque, 'title')
    const corte = tituloCompleto.lastIndexOf(' - ')
    const titulo = corte > 0 ? tituloCompleto.slice(0, corte) : tituloCompleto
    const fuente =
      sacarTag(bloque, 'source') || (corte > 0 ? tituloCompleto.slice(corte + 3) : '')
    return {
      titulo,
      fuente,
      link: sacarTag(bloque, 'link'),
      fecha: sacarTag(bloque, 'pubDate'),
    }
  })
}

Deno.serve(async (req) => {
  // El navegador pregunta primero (preflight); le decimos que sí.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const categorias = Object.keys(FEEDS)
    const resultados = await Promise.all(
      categorias.map(async (cat) => {
        try {
          const r = await fetch(FEEDS[cat], {
            headers: { 'User-Agent': 'Mozilla/5.0 (recordatorios-app)' },
          })
          const xml = await r.text()
          return [cat, parsearFeed(xml)] as const
        } catch {
          return [cat, []] as const
        }
      })
    )

    const data = Object.fromEntries(resultados)
    return new Response(JSON.stringify(data), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
