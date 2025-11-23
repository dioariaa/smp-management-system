// src/hooks/useSiswaDashboard.js
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import {
  fetchSiswaProfile,
  fetchWeeklyAttendance,
  fetchGradesBySubject,
  fetchSiswaAnnouncements,
} from '../services/siswaDashboardService'

export const useSiswaDashboard = () => {
  const { user } = useAuthStore()

  const [profile, setProfile] = useState(null)
  const [weeklyAttendance, setWeeklyAttendance] = useState([])
  const [gradesBySubject, setGradesBySubject] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const prof = await fetchSiswaProfile(user.id)
        setProfile(prof)

        if (prof?.id) {
          const [att, grades, ann] = await Promise.all([
            fetchWeeklyAttendance(prof.id),
            fetchGradesBySubject(prof.id),
            fetchSiswaAnnouncements(prof.kelas_id),
          ])

          setWeeklyAttendance(att)
          setGradesBySubject(grades)
          setAnnouncements(ann)
        }
      } catch (err) {
        console.error(err)
        setError('Gagal memuat dashboard siswa.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  return {
    profile,
    weeklyAttendance,
    gradesBySubject,
    announcements,
    loading,
    error,
  }
}
