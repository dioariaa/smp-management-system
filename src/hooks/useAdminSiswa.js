// src/hooks/useAdminSiswa.js
import { useEffect, useState } from 'react'
import {
  fetchSiswas,
  fetchClasses,
  createSiswa,
  updateSiswa,
  deleteSiswa,
} from '../services/adminSiswaService'

export const useAdminSiswa = () => {
  const [siswas, setSiswas] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [siswaData, classData] = await Promise.all([
        fetchSiswas(),
        fetchClasses(),
      ])
      setSiswas(siswaData)
      setClasses(classData)
    } catch (err) {
      setError(err.message || 'Gagal memuat data siswa')
    } finally {
      setLoading(false)
    }
  }

  const addSiswa = async (payload) => {
    const data = await createSiswa(payload)
    setSiswas((prev) => [data, ...prev])
  }

  const editSiswa = async (id, payload) => {
    const data = await updateSiswa(id, payload)
    setSiswas((prev) => prev.map((s) => (s.id === id ? data : s)))
  }

  const removeSiswa = async (id) => {
    await deleteSiswa(id)
    setSiswas((prev) => prev.filter((s) => s.id !== id))
  }

  useEffect(() => {
    load()
  }, [])

  return {
    siswas,
    classes,
    loading,
    error,
    reload: load,
    addSiswa,
    editSiswa,
    removeSiswa,
  }
}
