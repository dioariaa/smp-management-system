import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/LoadingSpinner'
import { fetchAnnouncements } from '../../services/announcementService'

const PengumumanSiswa = () => {
  const { role } = useAuthStore()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchAnnouncements(role)
        setAnnouncements(data)
      } catch (err) {
        console.error('Fetch announcements siswa error:', err)
        setError('Gagal memuat pengumuman.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [role])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pengumuman
          </h1>
          <p className="text-gray-600 mt-1">
            Daftar pengumuman yang ditujukan untuk Anda.
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        {announcements.length === 0 ? (
          <p className="text-sm text-gray-500">
            Belum ada pengumuman.
          </p>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div
                key={a.id}
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
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default PengumumanSiswa
