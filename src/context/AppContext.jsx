import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { contentApi, screensApi, schedulesApi, announcementsApi, preferencesApi, subscribeToChanges } from '../lib/supabase'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [content, setContent] = useState([])
  const [screens, setScreens] = useState([])
  const [schedules, setSchedules] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [preferences, setPreferences] = useState({ academy_name: 'Academia Adelante', logo_url: null })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        contentApi.getAll(),
        screensApi.getAll(),
        schedulesApi.getAll(),
        announcementsApi.getActive(),
        preferencesApi.get(),
      ])

      const [c, s, sch, ann, pref] = results

      if (c.status === 'fulfilled') setContent(c.value.data || [])
      if (s.status === 'fulfilled') setScreens(s.value.data || [])
      if (sch.status === 'fulfilled') setSchedules(sch.value.data || [])
      if (ann.status === 'fulfilled') setAnnouncements(ann.value.data || [])
      if (pref.status === 'fulfilled' && pref.value.data) setPreferences(pref.value.data)
      
      if (results.some(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error))) {
        console.warn('Algunos datos no se cargaron correctamente')
      }
    } catch (err) {
      showToast('Error cargando datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadAll()

    // Suscripción realtime a cambios
    const subs = [
      subscribeToChanges('content', () => contentApi.getAll().then(r => setContent(r.data || []))),
      subscribeToChanges('screens', () => screensApi.getAll().then(r => setScreens(r.data || []))),
      subscribeToChanges('schedules', () => schedulesApi.getAll().then(r => setSchedules(r.data || []))),
      subscribeToChanges('announcements', () => announcementsApi.getActive().then(r => setAnnouncements(r.data || []))),
      subscribeToChanges('preferences', () => preferencesApi.get().then(r => { if (r.data) setPreferences(r.data) })),
    ]

    return () => subs.forEach(s => s.unsubscribe())
  }, [loadAll])

  return (
    <AppContext.Provider value={{
      content, setContent,
      screens, setScreens,
      schedules, setSchedules,
      announcements, setAnnouncements,
      preferences, setPreferences,
      loading, loadAll, showToast, toast
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
