// src/hooks/useAdminGuru.js
import { useEffect, useState } from 'react'
import {
  fetchGurus,
  createGuru,
  updateGuru,
  deleteGuru,
} from '../services/adminGuruService'

export const useAdminGuru = () => {
  const [gurus, setGurus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchGurus()
      setGurus(data)
    } catch (err) {
      setError(err.message || 'Gagal memuat data guru')
    } finally {
      setLoading(false)
    }
  }

  const addGuru = async (payload) => {
    const data = await createGuru(payload)
    setGurus((prev) => [data, ...prev])
  }

  const editGuru = async (id, payload) => {
    const data = await updateGuru(id, payload)
    setGurus((prev) => prev.map((g) => (g.id === id ? data : g)))
  }

  const removeGuru = async (id) => {
    await deleteGuru(id)
    setGurus((prev) => prev.filter((g) => g.id !== id))
  }

  useEffect(() => {
    load()
  }, [])

  return {
    gurus,
    loading,
    error,
    reload: load,
    addGuru,
    editGuru,
    removeGuru,
  }
}
