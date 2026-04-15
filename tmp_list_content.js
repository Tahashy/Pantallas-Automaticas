import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function list() {
  const { data, error } = await supabase.from('content').select('*')
  if (error) console.error(error)
  else console.log(JSON.stringify(data, null, 2))
}

list()
