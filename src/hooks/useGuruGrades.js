// src/hooks/useGuruGrades.js
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import {
  fetchGuruClasses,
  fetchStudentsByClass,
  fetchGradesByClassMapelDate,
  saveGradesForClass,
} from '../services/guruGradeService'

const todayStr = () => new Date().toISOString().slice(0, 10)

export const useGuruGrades = () => {
  const { user } = useAuthStore()

  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [mapel, setMapel] = useState('')
  const [tanggal, setTanggal] = useState(todayStr())
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState({}) // siswa_id -> nilai
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // load kelas sekali
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

  // load siswa + nilai saat kelas/mapel/tanggal berubah
  useEffect(() => {
    const load = async () => {
      if (!selectedClassId || !mapel || !tanggal) return

      try {
        setLoading(true)
        setError(null)

        const [siswaData, gradeData] = await Promise.all([
          fetchStudentsByClass(selectedClassId),
          fetchGradesByClassMapelDate(selectedClassId, mapel, tanggal),
        ])

        setStudents(
          siswaData.map((s) => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name || ''}`.trim(),
            nisn: s.nisn,
          }))
        )

        const map = {}
        gradeData.forEach((g) => {
          map[g.siswa_id] = g.nilai
        })
        setGrades(map)
      } catch (err) {
        console.error(err)
        setError('Gagal memuat siswa atau nilai.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [selectedClassId, mapel, tanggal])

  const changeGrade = (siswaId, value) => {
    setGrades((prev) => ({
      ...prev,
      [siswaId]: value,
    }))
  }

  const save = async () => {
    if (!user) {
      setError('User tidak terautentikasi')
      return
    }
    if (!selectedClassId) {
      setError('Pilih kelas dulu')
      return
    }
    if (!mapel) {
      setError('Isi nama mata pelajaran')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const items = students.map((s) => ({
        siswa_id: s.id,
        nilai: grades[s.id],
      }))

      await saveGradesForClass({
        userId: user.id,
        kelasId: selectedClassId,
        mapel,
        tanggal,
        items,
      })
    } catch (err) {
      console.error(err)
      setError('Gagal menyimpan nilai.')
    } finally {
      setSaving(false)
    }
  }

  return {
    classes,
    selectedClassId,
    setSelectedClassId,
    mapel,
    setMapel,
    tanggal,
    setTanggal,
    students,
    grades,
    changeGrade,
    save,
    loading,
    saving,
    error,
  }
}
