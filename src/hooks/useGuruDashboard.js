import { useState, useEffect } from 'react'
import { fetchGuruInfo, fetchTeachingSchedule, fetchRecentAbsensi } from '../services/guruService'
import { useAuthStore } from '../store/authStore'

export const useGuruDashboard = () => {
  const { user } = useAuthStore()
  const [guru, setGuru] = useState(null)
  const [jadwal, setJadwal] = useState([])
  const [absensi, setAbsensi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      setLoading(true)

      try {
        const guruData = await fetchGuruInfo(user.id)
        setGuru(guruData)

        if (guruData?.id) {
          const teaching = await fetchTeachingSchedule(guruData.id)
          const recentAbsensi = await fetchRecentAbsensi(guruData.id)
          setJadwal(teaching)
          setAbsensi(recentAbsensi)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  return { guru, jadwal, absensi, loading }
}
