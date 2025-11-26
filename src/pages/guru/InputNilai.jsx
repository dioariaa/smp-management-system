// src/pages/guru/InputNilai.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const TIPE_OPTIONS = [
  { value: 'tugas_harian', label: 'Tugas Harian' },
  { value: 'uts', label: 'UTS' },
  { value: 'uas', label: 'UAS' },
]

const InputNilai = () => {
  const { user } = useAuthStore()

  const [guru, setGuru] = useState(null)
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTipe, setSelectedTipe] = useState('tugas_harian')

  const [students, setStudents] = useState([])
  const [nilaiMap, setNilaiMap] = useState({})

  const [gradeHistory, setGradeHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editingNilai, setEditingNilai] = useState('')

  const tipeLabelMap = useMemo(() => {
    const map = {}
    TIPE_OPTIONS.forEach((t) => { map[t.value] = t.label })
    return map
  }, [])

  // 1. Ambil guru + kelas & mapel yang diajar dari jadwal
  useEffect(() => {
    const loadInitial = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Guru berdasarkan user_id (pakai maybeSingle biar gak 406)
        const { data: guruRow, error: guruError } = await supabase
          .from('gurus')
          .select('id, first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle()

        if (guruError && guruError.code !== 'PGRST116') {
          console.error('InputNilai guruError:', guruError)
          throw new Error('Gagal mengambil data guru.')
        }

        if (!guruRow) {
          throw new Error('Data guru tidak ditemukan.')
        }

        setGuru(guruRow)

        // Ambil jadwal mengajar guru → kelas & mapel
        const { data: jadwalRows, error: jadwalError } = await supabase
          .from('jadwal')
          .select(`
            id,
            mapel,
            kelas:kelas_id ( id, nama )
          `)
          .eq('guru_id', guruRow.id)

        if (jadwalError) {
          console.error('InputNilai jadwalError:', jadwalError)
          throw new Error('Gagal mengambil jadwal guru.')
        }

        const kelasMap = new Map()
        const mapelSet = new Set()

        ;(jadwalRows || []).forEach((j) => {
          if (j.kelas?.id) {
            kelasMap.set(j.kelas.id, j.kelas.nama || `Kelas ${j.kelas.id.slice(0, 4)}`)
          }
          if (j.mapel) {
            mapelSet.add(j.mapel)
          }
        })

        const kelasList = Array.from(kelasMap.entries()).map(([id, nama]) => ({
          id,
          nama,
        }))

        setClasses(kelasList)
        setSubjects(Array.from(mapelSet))

        if (!selectedClass && kelasList.length > 0) {
          setSelectedClass(kelasList[0].id)
        }
        if (!selectedSubject && mapelSet.size > 0) {
          setSelectedSubject(Array.from(mapelSet)[0])
        }
      } catch (err) {
        console.error('InputNilai init error:', err)
        setError(err.message || 'Gagal memuat data awal.')
      } finally {
        setLoading(false)
      }
    }

    loadInitial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const classMap = useMemo(() => {
    const map = new Map()
    classes.forEach((k) => {
      map.set(k.id, k.nama)
    })
    return map
  }, [classes])

  // 2. Ambil siswa untuk kelas terpilih
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) {
        setStudents([])
        setNilaiMap({})
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data: siswaRows, error: siswaError } = await supabase
          .from('siswas')
          .select('id, first_name, last_name, nisn')
          .eq('kelas_id', selectedClass)
          .order('first_name', { ascending: true })

        if (siswaError) {
          console.error('loadStudents siswaError:', siswaError)
          throw new Error('Gagal mengambil daftar siswa.')
        }

        setStudents(siswaRows || [])

        const map = {}
        ;(siswaRows || []).forEach((s) => {
          map[s.id] = ''
        })
        setNilaiMap(map)
      } catch (err) {
        console.error('loadStudents error:', err)
        setError(err.message || 'Gagal memuat daftar siswa.')
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [selectedClass])

  // 3. Ambil riwayat nilai untuk kombinasi (guru, kelas, mapel, tipe)
  useEffect(() => {
    const loadHistory = async () => {
      if (!guru || !selectedClass || !selectedSubject) {
        setGradeHistory([])
        return
      }

      try {
        setLoadingHistory(true)
        setError(null)

        let query = supabase
          .from('grades')
          .select(`
            id,
            nilai,
            tanggal,
            tipe,
            siswa:siswa_id (
              id,
              first_name,
              last_name,
              nisn
            )
          `)
          .eq('guru_id', guru.id)
          .eq('kelas_id', selectedClass)
          .eq('mapel', selectedSubject)
          .order('tanggal', { ascending: false })

        if (selectedTipe) {
          query = query.eq('tipe', selectedTipe)
        }

        const { data, error } = await query

        if (error) {
          console.error('loadHistory error:', error)
          throw new Error('Gagal mengambil riwayat nilai.')
        }

        setGradeHistory(data || [])
        setEditingId(null)
        setEditingNilai('')
      } catch (err) {
        console.error('loadHistory error:', err)
        setError(err.message || 'Gagal memuat riwayat nilai.')
      } finally {
        setLoadingHistory(false)
      }
    }

    loadHistory()
  }, [guru, selectedClass, selectedSubject, selectedTipe])

  const handleNilaiChange = (siswaId, nilaiStr) => {
    const value = nilaiStr.replace(/[^\d]/g, '')
    setNilaiMap((prev) => ({
      ...prev,
      [siswaId]: value,
    }))
  }

  const handleSave = async () => {
    if (!guru) {
      toast.error('Data guru belum siap.')
      return
    }
    if (!selectedClass) {
      toast.error('Pilih kelas terlebih dahulu.')
      return
    }
    if (!selectedSubject) {
      toast.error('Pilih mata pelajaran terlebih dahulu.')
      return
    }
    if (!selectedTipe) {
      toast.error('Pilih tipe nilai terlebih dahulu.')
      return
    }

    const entries = Object.entries(nilaiMap).filter(
      ([_, v]) => v !== '' && v != null
    )

    if (!entries.length) {
      toast.error('Masukkan minimal satu nilai siswa.')
      return
    }

    try {
      setSaving(true)

      const today = new Date().toISOString().slice(0, 10)

      const payload = entries.map(([siswaId, nilaiStr]) => ({
        siswa_id: siswaId,
        kelas_id: selectedClass,
        guru_id: guru.id,
        mapel: selectedSubject,
        nilai: Number(nilaiStr),
        tanggal: today,
        tipe: selectedTipe,
      }))

      const { error } = await supabase.from('grades').insert(payload)

      if (error) {
        console.error('insert grades error:', error)
        throw new Error('Gagal menyimpan nilai ke database.')
      }

      toast.success('Nilai berhasil disimpan.')

      // reset input nilai
      const resetMap = {}
      Object.keys(nilaiMap).forEach((id) => {
        resetMap[id] = ''
      })
      setNilaiMap(resetMap)

      // reload history
      const { data: historyData, error: historyError } = await supabase
        .from('grades')
        .select(`
          id,
          nilai,
          tanggal,
          tipe,
          siswa:siswa_id (
            id,
            first_name,
            last_name,
            nisn
          )
        `)
        .eq('guru_id', guru.id)
        .eq('kelas_id', selectedClass)
        .eq('mapel', selectedSubject)
        .order('tanggal', { ascending: false })

      if (!historyError) {
        setGradeHistory(historyData || [])
      }
    } catch (err) {
      console.error('handleSave error:', err)
      toast.error(err.message || 'Gagal menyimpan nilai.')
    } finally {
      setSaving(false)
    }
  }

  // ====== CRUD HISTORY: EDIT ======

  const startEdit = (row) => {
    setEditingId(row.id)
    setEditingNilai(String(row.nilai ?? ''))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingNilai('')
  }

  const handleHistoryNilaiChange = (value) => {
    const v = value.replace(/[^\d]/g, '')
    setEditingNilai(v)
  }

  const saveEdit = async () => {
    if (!editingId) return
    if (editingNilai === '') {
      toast.error('Nilai tidak boleh kosong.')
      return
    }

    const numeric = Number(editingNilai)
    if (Number.isNaN(numeric)) {
      toast.error('Nilai harus berupa angka.')
      return
    }

    try {
      const { error } = await supabase
        .from('grades')
        .update({ nilai: numeric })
        .eq('id', editingId)

      if (error) {
        console.error('update grade error:', error)
        throw new Error('Gagal memperbarui nilai di database.')
      }

      toast.success('Nilai berhasil diperbarui.')

      setGradeHistory((prev) =>
        prev.map((row) =>
          row.id === editingId ? { ...row, nilai: numeric } : row
        )
      )

      setEditingId(null)
      setEditingNilai('')
    } catch (err) {
      console.error('saveEdit error:', err)
      toast.error(err.message || 'Gagal memperbarui nilai.')
    }
  }

  // ====== CRUD HISTORY: DELETE ======

  const deleteGrade = async (id) => {
    const ok = window.confirm('Yakin ingin menghapus nilai ini?')
    if (!ok) return

    try {
      const { error } = await supabase.from('grades').delete().eq('id', id)

      if (error) {
        console.error('delete grade error:', error)
        throw new Error('Gagal menghapus nilai dari database.')
      }

      toast.success('Nilai berhasil dihapus.')

      setGradeHistory((prev) => prev.filter((row) => row.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setEditingNilai('')
      }
    } catch (err) {
      console.error('deleteGrade error:', err)
      toast.error(err.message || 'Gagal menghapus nilai.')
    }
  }

  if (loading && !guru && !classes.length) {
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
          <h1 className="text-2xl font-bold text-gray-900">Input Nilai Siswa</h1>
          <p className="text-gray-600 mt-1">
            Input dan kelola nilai per kelas, mata pelajaran, dan tipe nilai.
          </p>
          {guru && (
            <p className="text-xs text-gray-500 mt-1">
              Guru: {guru.first_name} {guru.last_name || ''}
            </p>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Filter Kelas, Mapel, Tipe Nilai */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kelas */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
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

          {/* Mapel */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Pilih Mapel</option>
              {subjects.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Tipe Nilai */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tipe Nilai
            </label>
            <select
              value={selectedTipe}
              onChange={(e) => setSelectedTipe(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {TIPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Tabel Input Nilai */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        {!selectedClass ? (
          <p className="text-sm text-gray-500">Pilih kelas terlebih dahulu.</p>
        ) : !selectedSubject ? (
          <p className="text-sm text-gray-500">
            Pilih mata pelajaran terlebih dahulu.
          </p>
        ) : !students.length ? (
          <p className="text-sm text-gray-500">
            Tidak ada siswa di kelas ini.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3">Nama</th>
                    <th className="text-left py-2 px-3">NISN</th>
                    <th className="text-left py-2 px-3">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 px-3">
                        {s.first_name} {s.last_name || ''}
                      </td>
                      <td className="py-2 px-3">{s.nisn || '-'}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={nilaiMap[s.id] ?? ''}
                          onChange={(e) =>
                            handleNilaiChange(s.id, e.target.value)
                          }
                          className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-xs md:text-sm"
                          placeholder="0-100"
                          maxLength={3}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Simpan Nilai'}
              </button>
            </div>
          </>
        )}
      </motion.div>

      {/* Riwayat Nilai */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Riwayat Nilai – {classMap.get(selectedClass) || '-'} /{' '}
            {selectedSubject || '-'} / {tipeLabelMap[selectedTipe] || '-'}
          </h2>
        </div>

        {loadingHistory ? (
          <p className="text-sm text-gray-500">Memuat riwayat nilai...</p>
        ) : !gradeHistory.length ? (
          <p className="text-sm text-gray-500">
            Belum ada nilai untuk kombinasi ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3">Tanggal</th>
                  <th className="text-left py-2 px-3">Nama Siswa</th>
                  <th className="text-left py-2 px-3">NISN</th>
                  <th className="text-left py-2 px-3">Tipe</th>
                  <th className="text-left py-2 px-3">Nilai</th>
                  <th className="text-left py-2 px-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {gradeHistory.map((row) => {
                  const nama = `${row.siswa?.first_name || ''} ${
                    row.siswa?.last_name || ''
                  }`.trim()
                  const isEditing = editingId === row.id

                  return (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 px-3">
                        {row.tanggal
                          ? new Date(row.tanggal).toLocaleDateString('id-ID')
                          : '-'}
                      </td>
                      <td className="py-2 px-3">{nama || '-'}</td>
                      <td className="py-2 px-3">
                        {row.siswa?.nisn || '-'}
                      </td>
                      <td className="py-2 px-3">
                        {tipeLabelMap[row.tipe] || row.tipe || '-'}
                      </td>
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingNilai}
                            onChange={(e) =>
                              handleHistoryNilaiChange(e.target.value)
                            }
                            className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-xs"
                            maxLength={3}
                          />
                        ) : (
                          row.nilai ?? '-'
                        )}
                      </td>
                      <td className="py-2 px-3 space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(row)}
                              className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteGrade(row.id)}
                              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default InputNilai
