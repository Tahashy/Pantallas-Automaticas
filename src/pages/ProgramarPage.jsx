import React, { useState, useEffect, useCallback, useRef } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useApp } from '../context/AppContext'
import { Button, Card, Badge, EmptyState, Spinner, Modal, ConfirmModal } from '../components/shared/UI'
import { supabase, playlistsApi, contentApi } from '../lib/supabase'

export function ProgramarPage() {
  const { screens, content, showToast } = useApp()
  const [selectedScreen, setSelectedScreen] = useState(null)
  const [playlistItems, setPlaylistItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const isReorderingRef = useRef(false)

  // Seleccionar la primera pantalla por defecto
  useEffect(() => {
    if (screens.length > 0 && !selectedScreen) {
      setSelectedScreen(screens[0])
    }
  }, [screens, selectedScreen])

  const loadPlaylistItems = useCallback(async (isSilent = false) => {
    if (!selectedScreen) return
    if (!isSilent) setLoading(true)
    try {
      const { data } = await playlistsApi.getItemsByScreen(selectedScreen.id)
      setPlaylistItems(data || [])
    } catch (err) {
      console.error(err)
      if (!isSilent) showToast('Error al cargar la programación', 'error')
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [selectedScreen, showToast])

  useEffect(() => {
    loadPlaylistItems()
    
    // Suscribirse a cambios en playlist_items para esta pantalla
    const channel = supabase
      .channel('playlist-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playlist_items' }, () => {
        if (!isReorderingRef.current) {
          loadPlaylistItems(true)
        }
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [loadPlaylistItems])

  const handleAddContent = async (contentItem) => {
    try {
      // Obtener el playlist_id de la pantalla
      let { data: sp } = await supabase
        .from('screen_playlists')
        .select('playlist_id')
        .eq('screen_id', selectedScreen.id)
        .single()

      let playlistId = sp?.playlist_id

      // Si la pantalla no tiene playlist, crear una
      if (!playlistId) {
        const { data: newPlaylist } = await supabase
          .from('playlists')
          .insert({ name: `Playlist ${selectedScreen.name}` })
          .select()
          .single()
        
        playlistId = newPlaylist.id
        await playlistsApi.assignToScreen(selectedScreen.id, playlistId)
      }

      await playlistsApi.addItem(playlistId, contentItem.id, playlistItems.length)
      showToast('Contenido asignado a la pantalla')
    } catch (err) {
      showToast('Error al asignar contenido', 'error')
    }
  }

  const handleRemoveItem = async () => {
    if (!confirmDelete) return
    try {
      await playlistsApi.removeItem(confirmDelete.id)
      showToast('Contenido removido')
    } catch (err) {
      showToast('Error al remover contenido', 'error')
    } finally {
      setConfirmDelete(null)
    }
  }

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    // Si no cambió de posición, no hacemos nada
    if (result.destination.index === result.source.index) return;
    
    const items = Array.from(playlistItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Optimistic UI update
    setPlaylistItems(items);
    
    // Bloquear actualizaciones en vivo temporales para evitar parpadeos
    isReorderingRef.current = true;
    
    const updates = items.map((item, index) => ({
      id: item.id,
      position: index
    }));
    
    try {
      await playlistsApi.updatePositions(updates);
    } catch (err) {
      console.error(err);
      showToast('Error al actualizar el orden', 'error');
      loadPlaylistItems(true); // revert on error
    } finally {
      setTimeout(() => {
        isReorderingRef.current = false;
        loadPlaylistItems(true);
      }, 500);
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Sidebar: Pantallas */}
      <div style={{ width: 280, borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: 20, overflowY: 'auto' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 16 }}>Pantallas Disponibles</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {screens.map((screen, i) => (
            <div 
              key={screen.id} 
              onClick={() => setSelectedScreen(screen)}
              style={{
                padding: '12px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                background: selectedScreen?.id === screen.id ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${selectedScreen?.id === screen.id ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 12
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: screen.is_active ? 'var(--green)' : 'var(--text3)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedScreen?.id === screen.id ? 'var(--accent)' : 'var(--text)' }}>{screen.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{screen.location || 'Sin ubicación'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main: Programación de la pantalla */}
      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', background: 'var(--bg)' }}>
        {selectedScreen ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Programación: {selectedScreen.name}</h2>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Gestiona el orden y la visibilidad del contenido en esta pantalla</p>
              </div>
              <Button variant="primary" onClick={() => setModalOpen(true)}>+ Añadir Contenido</Button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spinner size={32} /></div>
            ) : playlistItems.length === 0 ? (
              <EmptyState 
                icon="📺" 
                title="La pantalla está vacía" 
                desc="Añade imágenes o videos de tu biblioteca para empezar a proyectar en esta pantalla."
                action={<Button variant="primary" onClick={() => setModalOpen(true)}>Abrir Biblioteca</Button>}
              />
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="playlist" direction="horizontal">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}
                    >
                      {playlistItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                transition: snapshot.isDragging ? 'none' : provided.draggableProps.style?.transition,
                                zIndex: snapshot.isDragging ? 100 : 'auto',
                              }}
                            >
                              <PlaylistItem 
                                item={item} 
                                index={index} 
                                onRemove={() => setConfirmDelete(item)} 
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)' }}>
            Selecciona una pantalla para comenzar a programar
          </div>
        )}
      </div>

      <ConfirmModal 
        open={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={handleRemoveItem}
        title="Remover de Programación"
        message={`¿Deseas quitar "${confirmDelete?.content?.name}" de la programación de esta pantalla?`}
      />

      {/* Modal: Biblioteca de Contenido */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Biblioteca de Contenido" width="700px">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, maxHeight: '60vh', overflowY: 'auto', padding: 4 }}>
          {content.filter(c => c.is_active).map(c => {
            const isAlreadyAdded = playlistItems.some(pi => pi.content_id === c.id)
            return (
              <Card key={c.id} style={{ opacity: isAlreadyAdded ? 0.6 : 1 }}>
                <div style={{ aspectRatio: '16/9', background: 'var(--surface2)', position: 'relative', overflow: 'hidden' }}>
                   {c.file_url && c.type === 'image' ? <img src={c.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 
                    c.file_url && c.type === 'video' ? <video src={c.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted /> : 
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📄</div>}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6 }}>{c.name}</div>
                  <Button 
                    size="sm" 
                    variant={isAlreadyAdded ? 'outline' : 'primary'} 
                    style={{ width: '100%', fontSize: 10 }}
                    onClick={() => handleAddContent(c)}
                    disabled={isAlreadyAdded}
                  >
                    {isAlreadyAdded ? 'Agregado' : 'Añadir'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}

function PlaylistItem({ item, index, onRemove, isDragging }) {
  const [hover, setHover] = useState(false)
  const c = item.content
  return (
    <Card 
      onMouseEnter={() => setHover(true)} 
      onMouseLeave={() => setHover(false)} 
      style={{ 
        position: 'relative',
        transform: isDragging ? 'scale(1.02)' : 'none',
        boxShadow: isDragging ? '0 12px 24px rgba(0,0,0,0.2)' : undefined,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 5, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
        #{index + 1}
      </div>
      <div style={{ aspectRatio: '16/9', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        {c.file_url && c.type === 'image' ? (
          <img src={c.file_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : c.file_url && c.type === 'video' ? (
          <video src={c.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
        ) : (
          <span style={{ fontSize: 32 }}>📄</span>
        )}
        {hover && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <button onClick={onRemove} style={{ background: 'var(--red)', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Quitar</button>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
        <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 4 }}>Duración: {c.duration}s</div>
      </div>
    </Card>
  )
}
