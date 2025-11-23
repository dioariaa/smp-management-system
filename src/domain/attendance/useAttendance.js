import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { getAttendance, saveAttendance } from './attendanceService'

export const useAttendance = (date = null) => {
  const { role, user } = useAuthStore()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    const data = await getAttendance({ role, userId: user?.id, date })
    setRecords(data)
    setLoading(false)
  }

  const update = async (payload) => {
    await saveAttendance({ role, payload })
    refresh()
  }

  useEffect(() => {
    if (user) refresh()
  }, [user, date])

  return { records, refresh, update, loading }
}
