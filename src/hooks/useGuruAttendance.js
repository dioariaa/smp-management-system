import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import {
  fetchGuruClasses,
  fetchStudentsByClass,
  fetchAttendanceByClassAndDate,
  saveAttendanceForClass,
} from '../services/guruAttendanceService'

const todayStr = () => new Date().toISOString().slice(0, 10)

export const useGuruAttendance = () => {
  const { user } = useAuthStore()

  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [date, setDate] = useState(todayStr())
  const [students, setStudents] = useState([])
  const [statuses, setStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // load classes once
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const cls = await fetchGuruClasses()
        setClasses(cls)
      } catch (err) {
        console.error(err)
        setError('Gagal memuat kelas.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Reload students when class/date changes
  useEffect(() => {
    const load = async () => {
      if (!selectedClassId || !date) return

      try {
        setLoading(true)

        const [siswaData, attendanceData] = await Promise.all([
          fetchStudentsByClass(selectedClassId),
          fetchAttendanceByClassAndDate(selectedClassId, date),
        ])

        setStudents(
          siswaData.map((s) => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name || ''}`.trim(),
            nisn: s.nisn,
          }))
        )

        const map = {}
        attendanceData.forEach((a) => {
          map[a.siswa_id] = a.status
        })
        setStatuses(map)

      } catch (err) {
        console.error(err)
        setError('Gagal memuat siswa atau absensi.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [selectedClassId, date])

  const changeStatus = (siswaId, status) => {
    setStatuses((prev) => ({
      ...prev,
      [siswaId]: status,
    }))
  }

  const save = async () => {
    if (!user || !selectedClassId) return

    try {
      setSaving(true)

      const items = students.map((s) => ({
        siswa_id: s.id,
        status: statuses[s.id] || 'hadir',
      }))

      await saveAttendanceForClass({
        userId: user.id,
        kelasId: selectedClassId,
        date,
        items,
      })

    } catch (err) {
      console.error(err)
      setError('Gagal menyimpan absensi.')
    } finally {
      setSaving(false)
    }
  }

  return {
    classes,
    selectedClassId,
    setSelectedClassId,
    date,
    setDate,
    students,
    statuses,
    changeStatus,
    save,
    loading,
    saving,
    error,
  }
}
