// src/hooks/useGuruDashboard.js
import { useState, useEffect } from 'react'
import { fetchGuruInfo, fetchTeachingSchedule, fetchRecentAbsensi } from '../services/guruService'
import { useAuthStore } from '../store/authStore'

export const useGuruDashboard = () => {
  const { user } = useAuthStore()

  const [guru, setGuru] = useState(null)
  const [jadwal, setJadwal] = useState([])
  const [absensi, setAbsensi] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setGuru(null)
        setJadwal([])
        setAbsensi([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const guruData = await fetchGuruInfo(user.id)

        // Jika akun guru belum terhubung dengan row di tabel `gurus`
        if (!guruData) {
          setGuru(null)
          setError(
            'Akun ini belum terhubung dengan data guru di sistem. Silakan hubungi admin untuk verifikasi NIP dan aktivasi akun.'
          )
          return
        }

        setGuru(guruData)

        // Load data dashboard
        const [teaching, recentAbsensi] = await Promise.all([
          fetchTeachingSchedule(guruData.id),
          fetchRecentAbsensi(guruData.id)
        ])

        setJadwal(teaching || [])
        setAbsensi(recentAbsensi || [])
      } catch (err) {
        console.error('useGuruDashboard error:', err)
        setError('Gagal memuat data dashboard guru.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  return { guru, jadwal, absensi, loading, error }
}
