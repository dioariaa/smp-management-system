// src/hooks/useSiswaGrades.js
import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { fetchSiswaGrades } from '../services/siswaGradeService'

const KKM_DEFAULT = 75

export const useSiswaGrades = () => {
  const { user } = useAuthStore()

  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedMapel, setSelectedMapel] = useState('all')
  const [kkm, setKkm] = useState(KKM_DEFAULT)

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const { grades: data } = await fetchSiswaGrades(user.id)
        setGrades(data)
      } catch (err) {
        console.error(err)
        setError(err.message || 'Gagal memuat nilai.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  // list mapel unik
  const mapelOptions = useMemo(() => {
    const set = new Set()
    grades.forEach((g) => {
      if (g.mapel) set.add(g.mapel)
    })
    return Array.from(set)
  }, [grades])

  // filter berdasarkan mapel
  const filteredGrades = useMemo(() => {
    if (selectedMapel === 'all') return grades
    return grades.filter((g) => g.mapel === selectedMapel)
  }, [grades, selectedMapel])

  // summary statistik
  const summary = useMemo(() => {
    if (!filteredGrades.length) {
      return {
        count: 0,
        avg: 0,
        max: 0,
        min: 0,
        belowKkm: 0,
      }
    }

    let total = 0
    let max = -Infinity
    let min = Infinity
    let belowKkm = 0

    filteredGrades.forEach((g) => {
      const v = Number(g.nilai || 0)
      total += v
      if (v > max) max = v
      if (v < min) min = v
      if (v < kkm) belowKkm += 1
    })

    return {
      count: filteredGrades.length,
      avg: total / filteredGrades.length,
      max,
      min,
      belowKkm,
    }
  }, [filteredGrades, kkm])

  return {
    grades,
    filteredGrades,
    loading,
    error,
    mapelOptions,
    selectedMapel,
    setSelectedMapel,
    kkm,
    setKkm,
    summary,
  }
}
