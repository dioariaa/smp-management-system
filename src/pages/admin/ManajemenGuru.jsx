// src/pages/admin/ManajemenGuru.jsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useAdminGuru } from '../../hooks/useAdminGuru'
import LoadingSpinner from '../../components/LoadingSpinner'
import { SUBJECT_OPTIONS } from '../../constants/subjects'

const emptyForm = {
  nip: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  status: 'aktif',
  mapel: '',        // <--- TAMBAH INI
}

const ManajemenGuru = () => {
  const { gurus, loading, error, addGuru, editGuru, removeGuru } = useAdminGuru()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)

      // Validasi minimal: mapel wajib
      if (!form.mapel) {
        alert('Pilih mata pelajaran yang diajar guru.')
        setSubmitting(false)
        return
      }

      if (editingId) {
        await editGuru(editingId, form)
      } else {
        await addGuru(form)
      }
      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Gagal menyimpan data guru')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (guru) => {
    setEditingId(guru.id)
    setForm({
      nip: guru.nip || '',
      first_name: guru.first_name || '',
      last_name: guru.last_name || '',
      email: guru.email || '',
      phone: guru.phone || '',
      status: guru.status || 'aktif',
      mapel: guru.mapel || '',    // <--- BACA MAPEL SAAT EDIT
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus guru ini?')) return
    try {
      await removeGuru(id)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Gagal menghapus guru')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Guru</h1>
          <p className="text-gray-600 mt-1">
            Kelola data guru yang terdaftar di sistem
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIP
            </label>
            <input
              type="text"
              name="nip"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.nip}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Depan
            </label>
            <input
              type="text"
              name="first_name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Belakang
            </label>
            <input
              type="text"
              name="last_name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.last_name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              No. HP
            </label>
            <input
              type="text"
              name="phone"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          {/* MAPEL DROPDOWN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mata Pelajaran
            </label>
            <select
              name="mapel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.mapel}
              onChange={handleChange}
            >
              <option value="">Pilih mata pelajaran</option>
              {SUBJECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={handleChange}
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>

          <div className="md:col-span-3 flex gap-2 mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {editingId ? (
                <>
                  <Edit2 size={16} className="mr-2" />
                  Simpan Perubahan
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Tambah Guru
                </>
              )}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Tabel Guru */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Daftar Guru</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-3">NIP</th>
                <th className="text-left py-2 px-3">Nama</th>
                <th className="text-left py-2 px-3">Mapel</th>
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">No. HP</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-right py-2 px-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {gurus.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-gray-500 py-4 text-sm"
                  >
                    Belum ada data guru.
                  </td>
                </tr>
              )}
              {gurus.map((g) => (
                <tr key={g.id} className="border-b last:border-0">
                  <td className="py-2 px-3">{g.nip}</td>
                  <td className="py-2 px-3">
                    {g.first_name} {g.last_name || ''}
                  </td>
                  <td className="py-2 px-3">
                    {g.mapel || '-'}
                  </td>
                  <td className="py-2 px-3">{g.email}</td>
                  <td className="py-2 px-3">{g.phone}</td>
                  <td className="py-2 px-3 capitalize">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        g.status === 'aktif'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {g.status || '-'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right space-x-2">
                    <button
                      onClick={() => startEdit(g)}
                      className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Edit2 size={14} className="mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="inline-flex items-center px-2 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default ManajemenGuru
