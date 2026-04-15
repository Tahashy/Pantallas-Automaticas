import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── CONTENT ──────────────────────────────────────────────────
export const contentApi = {
  getAll: () =>
    supabase.from('content').select('*').order('created_at', { ascending: false }),

  create: (data) =>
    supabase.from('content').insert(data).select().single(),

  update: (id, data) =>
    supabase.from('content').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id),

  delete: (id) =>
    supabase.from('content').delete().eq('id', id),

  uploadFile: async (file, folder = 'content') => {
    const ext = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('media').upload(fileName, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName)
    return publicUrl
  }
}

// ── SCREENS ──────────────────────────────────────────────────
export const screensApi = {
  getAll: () =>
    supabase.from('screens').select('*').order('created_at'),

  update: (id, data) =>
    supabase.from('screens').update(data).eq('id', id),
}

// ── PLAYLISTS ─────────────────────────────────────────────────
export const playlistsApi = {
  getAll: () =>
    supabase.from('playlists').select(`
      *,
      playlist_items (
        *,
        content (*)
      )
    `).order('created_at'),

  addItem: (playlistId, contentId, position = 0) =>
    supabase.from('playlist_items').insert({ playlist_id: playlistId, content_id: contentId, position }),

  removeItem: (itemId) =>
    supabase.from('playlist_items').delete().eq('id', itemId),

  updatePositions: async (updates) => {
    return Promise.all(
      updates.map(item =>
        supabase.from('playlist_items').update({ position: item.position }).eq('id', item.id)
      )
    )
  },

  assignToScreen: (screenId, playlistId) =>
    supabase.from('screen_playlists').upsert({ screen_id: screenId, playlist_id: playlistId }),

  getItemsByScreen: async (screenId) => {
    // Primero obtenemos el playlist_id asignado a la pantalla
    const { data: sp } = await supabase
      .from('screen_playlists')
      .select('playlist_id')
      .eq('screen_id', screenId)
      .single()
    
    if (!sp) return { data: [] }

    // Luego obtenemos los items de ese playlist
    return supabase
      .from('playlist_items')
      .select('*, content(*)')
      .eq('playlist_id', sp.playlist_id)
      .order('position')
  }
}

// ── SCHEDULES ─────────────────────────────────────────────────
export const schedulesApi = {
  getByDay: (day) =>
    supabase.from('schedules').select('*').eq('day_of_week', day).eq('is_active', true).order('start_time'),

  getAll: () =>
    supabase.from('schedules').select('*').eq('is_active', true).order('day_of_week').order('start_time'),

  create: (data) =>
    supabase.from('schedules').insert(data).select().single(),

  update: (id, data) =>
    supabase.from('schedules').update(data).eq('id', id),

  delete: (id) =>
    supabase.from('schedules').update({ is_active: false }).eq('id', id),
}

// ── ANNOUNCEMENTS ─────────────────────────────────────────────
export const announcementsApi = {
  getActive: () =>
    supabase.from('announcements')
      .select('*')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false }),

  create: (data) =>
    supabase.from('announcements').insert(data).select().single(),

  update: (id, data) =>
    supabase.from('announcements').update(data).eq('id', id),

  delete: (id) =>
    supabase.from('announcements').update({ is_active: false }).eq('id', id),
}

// ── PREFERENCES ───────────────────────────────────────────────
export const preferencesApi = {
  get: () => supabase.from('preferences').select('*').single(),
  
  update: (data) => 
    supabase.from('preferences').update({ ...data, updated_at: new Date().toISOString() }).eq('id', 1),
}

// ── REALTIME ──────────────────────────────────────────────────
export const subscribeToChanges = (table, callback) => {
  return supabase
    .channel(`${table}-changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()
}
