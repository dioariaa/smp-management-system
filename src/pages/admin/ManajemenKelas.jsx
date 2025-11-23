import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useAdminKelas } from '../../hooks/useAdminKelas'
import LoadingSpinner from '../../components/LoadingSpinner'

const emptyForm = {
  nama: '',
  wali_guru_id: '',
}

const ManajemenKelas = () => {
  const {
    classes,
    gurus,
    loading,
    error,
    addClass,
    editClass,
    removeClass,
  } = useAdminKelas()

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
      if (!form.nama) {
        alert('Nama kelas wajib diisi')
        return
      }
      setSubmitting(true)
      if (editingId) {
        await editClass(editingId, form)
      } else {
        await addClass(form)
      }
      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Gagal menyimpan kelas')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (kelas) => {
    setEditingId(kelas.id)
    setForm({
      nama: kelas.nama || '',
      wali_guru_id: kelas.wali_guru_id || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus kelas ini?')) return
    try {
      await removeClass(id)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Gagal menghapus kelas')
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Kelas</h1>
          <p className="text-gray-600 mt-1">
            Kelola daftar kelas dan wali kelas
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
              Nama Kelas
            </label>
            <input
              type="text"
              name="nama"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.nama}
              onChange={handleChange}
              placeholder="Misal: X IPA 1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wali Kelas
            </label>
            <select
              name="wali_guru_id"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.wali_guru_id}
              onChange={handleChange}
            >
              <option value="">Pilih Guru (opsional)</option>
              {gurus.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.first_name} {g.last_name || ''} ({g.nip || '-'})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex items-end">
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
                  Tambah Kelas
                </>
              )}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="ml-2 inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Tabel Kelas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Daftar Kelas
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-3">Nama Kelas</th>
                <th className="text-left py-2 px-3">Wali Kelas</th>
                <th className="text-right py-2 px-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center text-gray-500 py-4 text-sm"
                  >
                    Belum ada data kelas.
                  </td>
                </tr>
              )}

              {classes.map((k) => (
                <tr key={k.id} className="border-b last:border-0">
                  <td className="py-2 px-3">{k.nama}</td>
                  <td className="py-2 px-3">
                    {k.wali
                      ? `${k.wali.first_name} ${k.wali.last_name || ''} (${
                          k.wali.nip || '-'
                        })`
                      : '-'}
                  </td>
                  <td className="py-2 px-3 text-right space-x-2">
                    <button
                      onClick={() => startEdit(k)}
                      className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Edit2 size={14} className="mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(k.id)}
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

export default ManajemenKelas
