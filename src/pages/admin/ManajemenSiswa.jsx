// src/pages/admin/ManajemenSiswa.jsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useAdminSiswa } from '../../hooks/useAdminSiswa'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const emptyForm = {
  nisn: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  kelas_id: '',
  status: 'aktif',
}

const ManajemenSiswa = () => {
  const { siswas, classes, loading, error, addSiswa, editSiswa, removeSiswa } =
    useAdminSiswa()

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

      // Validasi minimal
      if (!form.nisn || !form.first_name) {
        toast.error('NISN dan nama depan wajib diisi.')
        return
      }

      const payload = {
        nisn: form.nisn.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        kelas_id: form.kelas_id || null,
        status: form.status || 'aktif',
      }

      if (editingId) {
        await editSiswa(editingId, payload)
        toast.success('Data siswa berhasil diperbarui.')
      } else {
        await addSiswa(payload)
        toast.success('Siswa baru berhasil ditambahkan.')
      }

      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Gagal menyimpan data siswa.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (siswa) => {
    setEditingId(siswa.id)
    setForm({
      nisn: siswa.nisn || '',
      first_name: siswa.first_name || '',
      last_name: siswa.last_name || '',
      email: siswa.email || '',
      phone: siswa.phone || '',
      kelas_id: siswa.kelas_id || '',
      status: siswa.status || 'aktif',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus siswa ini?')) return
    try {
      await removeSiswa(id)
      toast.success('Siswa berhasil dihapus.')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Gagal menghapus siswa.')
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Siswa</h1>
          <p className="text-gray-600 mt-1">
            Kelola data siswa yang terdaftar di sistem. Siswa akan membuat akun
            login sendiri menggunakan NISN melalui halaman registrasi.
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
          {/* NISN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NISN
            </label>
            <input
              type="text"
              name="nisn"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.nisn}
              onChange={handleChange}
              required
            />
          </div>

          {/* Nama Depan */}
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

          {/* Nama Belakang */}
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

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (opsional)
            </label>
            <input
              type="email"
              name="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          {/* No HP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              No. HP (opsional)
            </label>
            <input
              type="text"
              name="phone"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          {/* Kelas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kelas
            </label>
            <select
              name="kelas_id"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.kelas_id}
              onChange={handleChange}
            >
              <option value="">Pilih Kelas</option>
              {classes.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
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

          {/* Tombol submit */}
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
                  Tambah Siswa
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

      {/* Tabel Siswa */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Daftar Siswa</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-3">NISN</th>
                <th className="text-left py-2 px-3">Nama</th>
                <th className="text-left py-2 px-3">Kelas</th>
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">No. HP</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-right py-2 px-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {siswas.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-gray-500 py-4 text-sm"
                  >
                    Belum ada data siswa.
                  </td>
                </tr>
              )}
              {siswas.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 px-3">{s.nisn}</td>
                  <td className="py-2 px-3">
                    {s.first_name} {s.last_name || ''}
                  </td>
                  <td className="py-2 px-3">{s.kelas_nama || '-'}</td>
                  <td className="py-2 px-3">{s.email || '-'}</td>
                  <td className="py-2 px-3">{s.phone || '-'}</td>
                  <td className="py-2 px-3 capitalize">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        s.status === 'aktif'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {s.status || '-'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right space-x-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Edit2 size={14} className="mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
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

export default ManajemenSiswa
