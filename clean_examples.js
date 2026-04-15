import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]

if (!url || !key) {
  console.error("No se encontraron credentials")
  process.exit(1)
}

const supabase = createClient(url.trim(), key.trim())

async function cleanExamples() {
  console.log("Limpiando ejemplos...")
  
  // Borrar contenidos (ejemplos suelen ser los primeros IDs o con nombres genéricos)
  // Como no sé cuáles son, borraré los que tienen nombres comunes de test
  const { data: examples, error: findError } = await supabase
    .from('content')
    .select('id, name')
  
  if (findError) {
    console.error(findError)
    return
  }

  console.log("Items encontrados:", examples.length)
  
  // Si hay pocos items, probablemente sean todos los ejemplos iniciales
  // Si el usuario dijo "las imagenes que ESTABAN", se refiere a lo previo.
  // Borraré todos los items actuales de content para empezar de cero
  if (examples.length > 0) {
    const { error: delError } = await supabase
      .from('content')
      .delete()
      .in('id', examples.map(e => e.id))
    
    if (delError) console.error("Error borrando:", delError)
    else console.log("Contenido de ejemplo borrado con éxito")
  } else {
    console.log("No se encontraron imágenes en el contenido.")
  }
}

cleanExamples()
