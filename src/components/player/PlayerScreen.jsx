import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, screensApi, schedulesApi, announcementsApi, contentApi, preferencesApi, playlistsApi } from '../../lib/supabase'

const DAY_MAP = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }
const DAY_ES = { Sun: 'Domingo', Mon: 'Lunes', Tue: 'Martes', Wed: 'Miércoles', Thu: 'Jueves', Fri: 'Viernes', Sat: 'Sábado' }

const SUBJECT_COLORS = {
  'Matemática': '#4CAF50', 'Física': '#2196F3', 'Química': '#FF5722',
  'Literatura': '#9C27B0', 'Historia': '#FF9800', 'Biología': '#00BCD4',
}

// ── PLAYER COMPONENT ──────────────────────────────────────────
export function PlayerScreen({ screenIndex = 0 }) {
  const [slides, setSlides] = useState([])
  const [current, setCurrent] = useState(0)
  const [schedules, setSchedules] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [content, setContent] = useState([])
  const [preferences, setPreferences] = useState({ academy_name: 'Academia Adelante', logo_url: null })
  const [clock, setClock] = useState('')
  const [paused, setPaused] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const timerRef = useRef(null)
  const DURATION = screenIndex === 0 ? 8000 : 10000

  // Clock
  useEffect(() => {
    const tick = () => {
      const n = new Date()
      const p = x => String(x).padStart(2, '0')
      setClock(`${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Monitor fullscreen change (for Esc key etc)
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Load data
  const loadData = useCallback(async () => {
    const day = DAY_MAP[new Date().getDay()]
    const screensRes = await screensApi.getAll()
    const screen = screensRes.data?.[screenIndex]
    
    if (!screen) return

    const [sch, ann, cnt, pref, playlistRes] = await Promise.all([
      schedulesApi.getByDay(day),
      announcementsApi.getActive(),
      contentApi.getAll(),
      preferencesApi.get(),
      playlistsApi.getItemsByScreen(screen.id)
    ])
    setSchedules(sch.data || [])
    setAnnouncements(ann.data || [])
    setContent(playlistRes.data?.map(i => i.content) || []) // Usar el contenido de la playlist asignada
    if (pref?.data) setPreferences(pref.data)
  }, [])

  useEffect(() => {
    loadData()

    // Realtime subs — refresh on any change
    const tables = ['schedules', 'announcements', 'content', 'preferences', 'playlist_items', 'screen_playlists']
    const subs = tables.map(t =>
      supabase.channel(`player-${screenIndex}-${t}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: t }, loadData)
        .subscribe()
    )
    return () => subs.forEach(s => s.unsubscribe())
  }, [loadData, screenIndex])

  // Build slides list
  useEffect(() => {
    const built = buildSlides(schedules, announcements, content, screenIndex, preferences)
    setSlides(built)
    setCurrent(0)
  }, [schedules, announcements, content, screenIndex, preferences])

  // Auto advance
  const play = useCallback(() => {
    clearTimeout(timerRef.current)
    if (!paused && slides.length > 1) {
      timerRef.current = setTimeout(() => setCurrent(c => (c + 1) % slides.length), DURATION)
    }
  }, [paused, slides.length, DURATION])

  useEffect(() => { play() }, [current, play])

  const currentSlide = slides[current]
  const day = DAY_MAP[new Date().getDay()]

  const tickerItems = [
    ...(preferences.ticker_text 
        ? preferences.ticker_text.split(' ★ ') 
        : [`${preferences.academy_name} · Trujillo, La Libertad`]
    ),
    ...announcements.map(a => a.title)
  ].filter(msg => msg && msg.trim() !== '')

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden', fontFamily: 'var(--sans)' }}>

      {/* Main slide area */}
      <div style={{ position: 'absolute', inset: 0, bottom: 46 }}>
        <AnimatePresence>
          {currentSlide && (
            <motion.div
              key={`${currentSlide.type}-${current}`}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <SlideRenderer slide={currentSlide} preferences={preferences} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
        {slides.map((_, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{
            height: 6, borderRadius: 3, cursor: 'pointer',
            width: i === current ? 24 : 6,
            background: i === current ? '#FFD700' : 'rgba(255,255,255,0.2)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Screen label */}
      <div style={{
        position: 'absolute', top: 14, left: 16, zIndex: 10,
        background: screenIndex === 0 ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)',
        border: `1px solid ${screenIndex === 0 ? 'rgba(59,130,246,0.4)' : 'rgba(34,197,94,0.4)'}`,
        color: screenIndex === 0 ? '#3b82f6' : '#22c55e',
        borderRadius: 6, padding: '4px 12px', fontSize: 11, fontFamily: 'var(--mono)',
      }}>
        P{screenIndex + 1} · {screenIndex === 0 ? 'Hall Principal' : 'Pasillo Aulas'}
      </div>

      {/* Controls */}
      <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', gap: 8, zIndex: 10, opacity: 0.3 }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.3}>
        <Cbtn onClick={() => setCurrent(c => (c - 1 + slides.length) % slides.length)}>◀</Cbtn>
        <Cbtn onClick={() => setPaused(p => !p)}>{paused ? '▶' : '⏸'}</Cbtn>
        <Cbtn onClick={() => setCurrent(c => (c + 1) % slides.length)}>▶</Cbtn>
        <Cbtn onClick={toggleFullscreen}>{isFullscreen ? '⤫' : '⛶'}</Cbtn>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 46,
        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, zIndex: 10,
      }}>
        <span style={{ color: '#FFD700', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{preferences.academy_name}</span>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={tickerItems.join('-')}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', gap: 60, whiteSpace: 'nowrap', animation: 'ticker 30s linear infinite' }}
            >
              {[...tickerItems, ...tickerItems].map((t, i) => (
                <span key={i} style={{ color: '#FFD700', fontSize: 13 }}>★  {t}</span>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        <span style={{ color: '#fff', fontFamily: 'var(--mono)', fontSize: 15, minWidth: 90, textAlign: 'right' }}>{clock}</span>
      </div>

    </div>
  )
}

// ── SLIDE BUILDER ─────────────────────────────────────────────
function buildSlides(schedules, announcements, content, screenIndex, preferences) {
  const slides = []

  // 1. Añadir Anuncios Urgentes (siempre primero)
  announcements.filter(a => a.type === 'urgent').forEach(a => slides.push({ type: 'announcement', data: a }))

  // 2. Añadir todo el contenido programado (Imágenes y Videos del usuario)
  content.forEach(c => slides.push({ type: 'content', data: c }))

  // 3. Añadir Anuncios Normales
  announcements.filter(a => a.type !== 'urgent').forEach(a => slides.push({ type: 'announcement', data: a }))

  // 4. Si no hay nada, mostrar una diapositiva de espera elegante en lugar de pantalla negra
  if (slides.length === 0) {
    slides.push({ type: 'welcome', preferences })
  }

  return slides
}

// ── SLIDE RENDERER ────────────────────────────────────────────
function SlideRenderer({ slide, preferences }) {
  const style = { position: 'absolute', inset: 0 }

  switch (slide.type) {
    case 'welcome': return <WelcomeSlide style={style} preferences={slide.preferences} />
    case 'announcement': return <AnnouncementSlide data={slide.data} style={style} />
    case 'schedule': return <ScheduleSlide data={slide.data} style={style} />
    case 'current-class': return <CurrentClassSlide data={slide.data} style={style} />
    case 'motivation': return <MotivationSlide style={style} preferences={preferences} />
    case 'events': return <EventsSlide style={style} />
    case 'content': return <ContentSlide data={slide.data} style={style} />
    default: return <WelcomeSlide style={style} />
  }
}

// ── SLIDES ─────────────────────────────────────────────────────
function WelcomeSlide({ style, preferences }) {
  const academyNameParts = (preferences?.academy_name || 'Academia\nAdelante').split(/(?: - | – |\\n)/)
  return (
    <div style={{ ...style, background: 'linear-gradient(135deg,#0a0030,#0d1b6e,#1a0a40)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 60 }}>
      {preferences?.logo_url ? (
        <div style={{ width: 130, height: 130, borderRadius: 24, padding: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <img src={preferences.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      ) : (
        <div style={{ width: 110, height: 110, borderRadius: '50%', background: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 700, color: '#0a0a2e', marginBottom: 28, fontFamily: 'var(--mono)' }}>A</div>
      )}
      <h1 style={{ color: '#FFD700', fontSize: 'clamp(28px,4.5vw,58px)', fontWeight: 700, lineHeight: 1.2 }}>{academyNameParts.map((p,i) => <React.Fragment key={p}>{p}{i < academyNameParts.length-1 && <br/>}</React.Fragment>)}</h1>
      <p style={{ color: '#90CAF9', fontSize: 'clamp(14px,2vw,26px)', marginTop: 12, fontWeight: 300 }}>Excelencia académica · Trujillo, La Libertad</p>
      <div style={{ marginTop: 32, padding: '14px 40px', border: '2px solid #FFD700', borderRadius: 50, color: '#FFD700', fontSize: 'clamp(12px,1.6vw,20px)' }}>
        Tu ingreso a la universidad comienza aquí
      </div>
    </div>
  )
}

function AnnouncementSlide({ data, style }) {
  const isUrgent = data.type === 'urgent'
  return (
    <div style={{ ...style, background: isUrgent ? 'radial-gradient(ellipse,#3a0000,#0a0000)' : 'radial-gradient(ellipse,#001a40,#050510)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 60 }}>
      <div style={{ background: data.bg_color || '#E53935', color: '#fff', padding: '8px 28px', borderRadius: 30, fontSize: 'clamp(11px,1.3vw,17px)', letterSpacing: 3, marginBottom: 30, fontWeight: 500 }}>
        {isUrgent ? 'AVISO IMPORTANTE' : 'COMUNICADO'}
      </div>
      <h2 style={{ color: '#fff', fontSize: 'clamp(24px,4.5vw,58px)', fontWeight: 700, lineHeight: 1.25 }}>{data.title}</h2>
      {data.body && <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 'clamp(13px,1.8vw,24px)', marginTop: 18, maxWidth: '75%', lineHeight: 1.6 }}>{data.body}</p>}
    </div>
  )
}

function ScheduleSlide({ data, style }) {
  const day = DAY_MAP[new Date().getDay()]
  const today = data.filter(s => s.day_of_week === day).slice(0, 6)
  return (
    <div style={{ ...style, background: '#050510', display: 'flex', flexDirection: 'column', padding: '40px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <h2 style={{ color: '#FFD700', fontSize: 'clamp(20px,3vw,40px)', fontWeight: 700 }}>Horario de hoy</h2>
        <div style={{ background: '#FFD700', color: '#000', padding: '6px 20px', borderRadius: 25, fontSize: 'clamp(12px,1.6vw,20px)', fontWeight: 700 }}>{DAY_ES[day]}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
        {today.map(cls => (
          <div key={cls.id} style={{ background: 'rgba(255,255,255,0.05)', borderLeft: `4px solid ${cls.color || SUBJECT_COLORS[cls.subject] || '#FFD700'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ color: '#90CAF9', fontFamily: 'var(--mono)', fontSize: 'clamp(11px,1.3vw,16px)', minWidth: 110 }}>{cls.start_time?.slice(0, 5)} – {cls.end_time?.slice(0, 5)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 'clamp(14px,1.8vw,22px)', fontWeight: 600 }}>{cls.subject}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(10px,1.1vw,14px)' }}>{cls.teacher}</div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)', fontSize: 11 }}>{cls.room}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CurrentClassSlide({ data, style }) {
  const day = DAY_MAP[new Date().getDay()]
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const todayClasses = data.filter(s => s.day_of_week === day).sort((a,b) => a.start_time.localeCompare(b.start_time))
  const current = todayClasses.find(c => c.start_time.slice(0,5) <= currentTime && c.end_time.slice(0,5) > currentTime)
  const next = current ? todayClasses[todayClasses.indexOf(current) + 1] : todayClasses.find(c => c.start_time.slice(0,5) > currentTime)

  return (
    <div style={{ ...style, background: '#050510', display: 'flex', flexDirection: 'column', padding: '44px 56px', justifyContent: 'space-between' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(11px,1.4vw,18px)', letterSpacing: 2, textTransform: 'uppercase' }}>
        {current ? 'Ahora en curso' : 'Próxima clase'}
      </div>
      <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 16, padding: 'clamp(20px,3vw,40px) clamp(24px,4vw,50px)', flex: 1, margin: '20px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ color: '#FFD700', fontSize: 'clamp(10px,1.2vw,16px)', letterSpacing: 2, marginBottom: 10 }}>
          {current ? 'CLASE ACTUAL' : 'CLASE SIGUIENTE'}
        </div>
        {current || next ? (
          <>
            <div style={{ color: '#fff', fontSize: 'clamp(28px,5.5vw,72px)', fontWeight: 700, lineHeight: 1.1 }}>{(current || next).subject}</div>
            <div style={{ color: '#90CAF9', fontSize: 'clamp(14px,2vw,28px)', marginTop: 10, fontWeight: 300 }}>{(current || next).teacher}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 18px', borderRadius: 30, color: '#fff', fontFamily: 'var(--mono)', fontSize: 'clamp(12px,1.6vw,20px)' }}>
                {(current || next).start_time?.slice(0,5)} – {(current || next).end_time?.slice(0,5)}
              </div>
              <div style={{ background: 'rgba(255,215,0,0.1)', padding: '8px 18px', borderRadius: 30, color: '#FFD700', fontSize: 'clamp(12px,1.6vw,20px)' }}>
                {(current || next).room}
              </div>
            </div>
          </>
        ) : (
          <div style={{ color: '#fff', fontSize: 32 }}>Sin más clases por hoy</div>
        )}
      </div>
      {next && current && (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, minWidth: 90 }}>A continuación</span>
          <span style={{ color: '#fff', fontSize: 'clamp(13px,1.7vw,22px)', fontWeight: 500 }}>{next.subject} — {next.teacher} · {next.room}</span>
          <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono)', fontSize: 14 }}>{next.start_time?.slice(0,5)}</span>
        </div>
      )}
    </div>
  )
}

function MotivationSlide({ style, preferences }) {
  // Podrás configurar estas frases desde el panel en el futuro
  const quotes = [
    { text: 'Tu ingreso a la universidad comienza aquí.', author: preferences.academy_name },
  ]
  const q = quotes[Math.floor(Date.now() / 60000) % quotes.length]
  return (
    <div style={{ ...style, background: 'radial-gradient(ellipse at top left,#002200,#001100)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 60 }}>
      <div style={{ color: 'rgba(76,175,80,0.35)', fontSize: 'clamp(80px,14vw,180px)', fontFamily: 'var(--mono)', lineHeight: 0.6, marginBottom: 24 }}>"</div>
      <blockquote style={{ color: '#fff', fontSize: 'clamp(18px,3.2vw,44px)', fontWeight: 300, lineHeight: 1.5, maxWidth: '80%', fontStyle: 'italic' }}>{q.text}</blockquote>
      <div style={{ color: '#A5D6A7', fontSize: 'clamp(12px,1.6vw,22px)', marginTop: 24, fontWeight: 500 }}>— {q.author}</div>
    </div>
  )
}

function EventsSlide({ style }) {
  // Podrás gestionar eventos desde el panel próximamente
  const events = []
  return (
    <div style={{ ...style, background: '#050510', display: 'flex', flexDirection: 'column', padding: '40px 56px' }}>
      <h2 style={{ color: '#FFD700', fontSize: 'clamp(18px,2.8vw,36px)', fontWeight: 700, marginBottom: 20 }}>Próximos eventos</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
        {events.map((ev, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderLeft: `4px solid ${ev.color}`, borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ textAlign: 'center', minWidth: 55 }}>
              <div style={{ color: '#fff', fontSize: 'clamp(20px,3vw,38px)', fontWeight: 700, fontFamily: 'var(--mono)' }}>{ev.day}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{ev.month}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', height: 40 }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 'clamp(13px,1.7vw,22px)', fontWeight: 600 }}>{ev.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(10px,1.2vw,15px)', marginTop: 3 }}>{ev.desc}</div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono)', fontSize: 13 }}>{ev.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContentSlide({ data, style }) {
  if (data.type === 'image' && data.file_url) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={data.file_url} alt={data.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    )
  }
  if (data.type === 'video' && data.file_url) {
    return (
      <div style={{ ...style }}>
        <video src={data.file_url} autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  return <WelcomeSlide style={style} />
}

function Cbtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>
      {children}
    </button>
  )
}
