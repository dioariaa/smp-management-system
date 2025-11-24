import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const JadwalAdmin = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [classes, setClasses] = useState([])
  const [gurus, setGurus] = useState([])
  const [jadwal, setJadwal] = useState([])

  const [form, setForm] = useState({
    kelas_id: '',
    guru_id: '',
    mapel: '',
    hari: 'Senin',
    jam_mulai: '',
    jam_selesai: '',
    ruangan: ''
  })

  const [editingId, setEditingId] = useState(null) // null = mode tambah
  const [error, setError] = useState(null)

  const classMap = useMemo(() => {
    const map = new Map()
    classes.forEach((k) => {
      map.set(k.id, k.nama || `Kelas ${k.id?.slice(0, 4)}`)
    })
    return map
  }, [classes])

  const guruMap = useMemo(() => {
    const map = new Map()
    gurus.forEach((g) => {
      map.set(
        g.id,
        `${g.first_name || ''} ${g.last_name || ''}`.trim() || g.email || g.id
      )
    })
    return map
  }, [gurus])

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Kelas
        const { data: kelasRows, error: kelasError } = await supabase
          .from('classes')
          .select('id, nama')
          .order('nama', { ascending: true })

        if (kelasError) throw kelasError
        setClasses(kelasRows || [])

        // 2. Guru
        const { data: guruRows, error: guruError } = await supabase
          .from('gurus')
          .select('id, first_name, last_name, email')
          .order('first_name', { ascending: true })

        if (guruError) throw guruError
        setGurus(guruRows || [])

        // 3. Jadwal
        await reloadJadwal()
      } catch (err) {
        console.error('JadwalAdmin load error:', err)
        setError(err.message || 'Gagal memuat data jadwal.')
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [])

  const reloadJadwal = async () => {
    try {
      const { data, error } = await supabase
        .from('jadwal')
        .select(`
          id,
          hari,
          jam_mulai,
          jam_selesai,
          mapel,
          ruangan,
          kelas:kelas_id ( id, nama ),
          guru:guru_id ( id, first_name, last_name )
        `)
        .order('hari', { ascending: true })
        .order('jam_mulai', { ascending: true })

      if (error) {
        console.error('reloadJadwal error:', error)
        throw error
      }

      setJadwal(data || [])
    } catch (err) {
      console.error('reloadJadwal error:', err)
      toast.error('Gagal memuat ulang jadwal')
    }
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setForm({
      kelas_id: '',
      guru_id: '',
      mapel: '',
      hari: 'Senin',
      jam_mulai: '',
      jam_selesai: '',
      ruangan: ''
    })
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.kelas_id || !form.guru_id || !form.mapel || !form.jam_mulai || !form.jam_selesai) {
      toast.error('Kelas, guru, mapel, jam mulai & jam selesai wajib diisi.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        kelas_id: form.kelas_id,
        guru_id: form.guru_id,
        mapel: form.mapel,
        hari: form.hari,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
        ruangan: form.ruangan || null
      }

      if (editingId) {
        // UPDATE
        const { error } = await supabase
          .from('jadwal')
          .update(payload)
          .eq('id', editingId)

        if (error) {
          console.error('Update jadwal error:', error)
          throw error
        }

        toast.success('Jadwal berhasil diperbarui.')
      } else {
        // INSERT
        const { error } = await supabase
          .from('jadwal')
          .insert(payload)

        if (error) {
          console.error('Insert jadwal error:', error)
          throw error
        }

        toast.success('Jadwal berhasil ditambahkan.')
      }

      resetForm()
      await reloadJadwal()
    } catch (err) {
      console.error('handleSubmit error:', err)
      toast.error('Gagal menyimpan jadwal.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (row) => {
    setEditingId(row.id)
    setForm({
      kelas_id: row.kelas?.id || row.kelas_id || '',
      guru_id: row.guru?.id || row.guru_id || '',
      mapel: row.mapel || '',
      hari: row.hari || 'Senin',
      jam_mulai: (row.jam_mulai || '').slice(0, 5),
      jam_selesai: (row.jam_selesai || '').slice(0, 5),
      ruangan: row.ruangan || ''
    })
  }

  const handleDeleteClick = async (id) => {
    const ok = window.confirm('Yakin ingin menghapus jadwal ini?')
    if (!ok) return

    try {
      const { error } = await supabase
        .from('jadwal')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete jadwal error:', error)
        throw error
      }

      toast.success('Jadwal berhasil dihapus.')
      await reloadJadwal()
    } catch (err) {
      console.error('handleDeleteClick error:', err)
      toast.error('Gagal menghapus jadwal.')
    }
  }

  if (loading && !jadwal.length && !classes.length) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Jadwal</h1>
          <p className="text-gray-600 mt-1">
            Tambah, ubah, dan hapus jadwal pelajaran untuk setiap kelas dan guru.
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form Tambah / Edit Jadwal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Batal edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kelas */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kelas
            </label>
            <select
              value={form.kelas_id}
              onChange={(e) => handleChange('kelas_id', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Pilih Kelas</option>
              {classes.map((k) => (
                <option key={k.id} value={k.id}>
                  {classMap.get(k.id)}
                </option>
              ))}
            </select>
          </div>

          {/* Guru */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Guru
            </label>
            <select
              value={form.guru_id}
              onChange={(e) => handleChange('guru_id', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Pilih Guru</option>
              {gurus.map((g) => (
                <option key={g.id} value={g.id}>
                  {guruMap.get(g.id)}
                </option>
              ))}
            </select>
          </div>

          {/* Hari */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hari
            </label>
            <select
              value={form.hari}
              onChange={(e) => handleChange('hari', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Mapel */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mata Pelajaran
            </label>
            <input
              type="text"
              value={form.mapel}
              onChange={(e) => handleChange('mapel', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Contoh: Matematika"
            />
          </div>

          {/* Jam Mulai */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Jam Mulai
            </label>
            <input
              type="time"
              value={form.jam_mulai}
              onChange={(e) => handleChange('jam_mulai', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Jam Selesai */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Jam Selesai
            </label>
            <input
              type="time"
              value={form.jam_selesai}
              onChange={(e) => handleChange('jam_selesai', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Ruangan */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Ruangan (opsional)
            </label>
            <input
              type="text"
              value={form.ruangan}
              onChange={(e) => handleChange('ruangan', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Contoh: Ruang 1"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving
                ? (editingId ? 'Menyimpan perubahan...' : 'Menyimpan...')
                : (editingId ? 'Update Jadwal' : 'Tambah Jadwal')}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Tabel Jadwal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Daftar Jadwal
        </h2>

        {!jadwal.length ? (
          <p className="text-sm text-gray-500">
            Belum ada jadwal yang terdaftar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3">Hari</th>
                  <th className="text-left py-2 px-3">Kelas</th>
                  <th className="text-left py-2 px-3">Mapel</th>
                  <th className="text-left py-2 px-3">Guru</th>
                  <th className="text-left py-2 px-3">Jam</th>
                  <th className="text-left py-2 px-3">Ruangan</th>
                  <th className="text-left py-2 px-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {jadwal.map((j) => (
                  <tr key={j.id} className="border-b last:border-0">
                    <td className="py-2 px-3">{j.hari}</td>
                    <td className="py-2 px-3">
                      {j.kelas?.nama || classMap.get(j.kelas_id) || '-'}
                    </td>
                    <td className="py-2 px-3">{j.mapel}</td>
                    <td className="py-2 px-3">
                      {j.guru
                        ? `${j.guru.first_name || ''} ${j.guru.last_name || ''}`.trim()
                        : guruMap.get(j.guru_id) || '-'}
                    </td>
                    <td className="py-2 px-3">
                      {(j.jam_mulai || '').slice(0, 5)} -{' '}
                      {(j.jam_selesai || '').slice(0, 5)}
                    </td>
                    <td className="py-2 px-3">{j.ruangan || '-'}</td>
                    <td className="py-2 px-3 space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(j)}
                        className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(j.id)}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default JadwalAdmin
