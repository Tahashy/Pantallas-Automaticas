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
      const [c, s, sch, ann, pref] = await Promise.all([
        contentApi.getAll(),
        screensApi.getAll(),
        schedulesApi.getAll(),
        announcementsApi.getActive(),
        preferencesApi.get(),
      ])
      setContent(c.data || [])
      setScreens(s.data || [])
      setSchedules(sch.data || [])
      setAnnouncements(ann.data || [])
      if (pref.data) setPreferences(pref.data)
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
