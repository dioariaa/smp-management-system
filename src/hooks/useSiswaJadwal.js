import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { fetchSiswaSchedule } from '../services/siswaJadwalService'

const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']

export const useSiswaJadwal = () => {
  const { user } = useAuthStore()
  const [jadwal, setJadwal] = useState([])
  const [selectedHari, setSelectedHari] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const data = await fetchSiswaSchedule(user.id)
        setJadwal(data)

        // default: hari ini kalau ada
        const todayName = DAYS[new Date().getDay() - 1] // 0=Min
        if (DAYS.includes(todayName)) {
          setSelectedHari(todayName)
        } else {
          setSelectedHari('Senin')
        }
      } catch (err) {
        console.error(err)
        setError(err.message || 'Gagal memuat jadwal.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const perHari = useMemo(() => {
    const map = {}
    DAYS.forEach((h) => (map[h] = []))
    jadwal.forEach((item) => {
      if (!map[item.hari]) map[item.hari] = []
      map[item.hari].push(item)
    })
    return map
  }, [jadwal])

  const jadwalHariIni = selectedHari ? perHari[selectedHari] || [] : []

  return {
    jadwal,
    perHari,
    selectedHari,
    setSelectedHari,
    jadwalHariIni,
    loading,
    error,
    days: DAYS,
  }
}
