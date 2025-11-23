// src/hooks/useAdminKelas.js
import { useEffect, useState } from 'react'
import {
  fetchClasses,
  fetchGurusForDropdown,
  createClass,
  updateClass,
  deleteClass,
} from '../services/adminKelasService'

export const useAdminKelas = () => {
  const [classes, setClasses] = useState([])
  const [gurus, setGurus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [classData, guruData] = await Promise.all([
        fetchClasses(),
        fetchGurusForDropdown(),
      ])
      setClasses(classData)
      setGurus(guruData)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Gagal memuat data kelas')
    } finally {
      setLoading(false)
    }
  }

  const addClass = async (payload) => {
    const data = await createClass(payload)
    setClasses((prev) => [...prev, data])
  }

  const editClass = async (id, payload) => {
    const data = await updateClass(id, payload)
    setClasses((prev) => prev.map((c) => (c.id === id ? data : c)))
  }

  const removeClass = async (id) => {
    await deleteClass(id)
    setClasses((prev) => prev.filter((c) => c.id !== id))
  }

  useEffect(() => {
    load()
  }, [])

  return {
    classes,
    gurus,
    loading,
    error,
    reload: load,
    addClass,
    editClass,
    removeClass,
  }
}
