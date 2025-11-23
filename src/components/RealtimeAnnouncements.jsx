import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../supabase/supabaseClient'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from './LoadingSpinner'
import { fetchAnnouncements } from '../services/announcementService'

const RealtimeAnnouncements = () => {
  const { role } = useAuthStore()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let channel

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchAnnouncements(role)
        setAnnouncements(data)
      } catch (err) {
        console.error('Fetch announcements error:', err)
        setError('Gagal memuat pengumuman.')
      } finally {
        setLoading(false)
      }
    }

    const subscribeRealtime = () => {
      channel = supabase
        .channel('announcements-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'announcements',
          },
          () => {
            load()
          }
        )
        .subscribe()
    }

    load()
    subscribeRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [role])

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error}
      </div>
    )
  }

  if (!announcements.length) {
    return (
      <p className="text-sm text-gray-500">
        Belum ada pengumuman.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {announcements.slice(0, 5).map((a) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-b last:border-0 pb-3"
        >
          <p className="font-medium text-gray-900 text-sm">
            {a.title || '(Tanpa judul)'}
          </p>
          <p className="text-xs text-gray-500 mb-1">
            {a.created_at
              ? new Date(a.created_at).toLocaleString('id-ID')
              : ''}
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {a.message || ''}
          </p>
        </motion.div>
      ))}
    </div>
  )
}

export default RealtimeAnnouncements
