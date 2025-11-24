// src/pages/guru/Absensi.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  fetchDailyAttendance,
  downloadAttendanceAsCsv
} from '../../services/attendanceExportService'

const STATUS_OPTIONS = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'alpa', label: 'Alpa' }
]

const Absensi = () => {
  const { user } = useAuthStore()

  const [guru, setGuru] = useState(null)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [students, setStudents] = useState([])
  const [attendanceMap, setAttendanceMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // 1. Ambil guru + kelas yang diajar
  useEffect(() => {
    const loadGuruAndClasses = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Guru
        const { data: guruRow, error: guruError } = await supabase
          .from('gurus')
          .select('id, first_name, last_name')
          .eq('user_id', user.id)
          .single()

        if (guruError || !guruRow) {
          throw new Error('Data guru tidak ditemukan')
        }

        setGuru(guruRow)

        // Kelas yang diampu guru dari JADWAL
        const { data: jadwalRows, error: jadwalError } = await supabase
          .from('jadwal')
          .select('kelas_id')
          .eq('guru_id', guruRow.id)

        if (jadwalError) {
          throw jadwalError
        }

        const kelasIds = Array.from(
          new Set((jadwalRows || []).map((j) => j.kelas_id).filter(Boolean))
        )

        if (kelasIds.length === 0) {
          setClasses([])
          setStudents([])
          setSelectedClass('')
          return
        }

        const { data: kelasRows, error: kelasError } = await supabase
          .from('classes')
          .select('id, nama')
          .in('id', kelasIds)

        if (kelasError) {
          throw kelasError
        }

        setClasses(kelasRows || [])
        // Auto pilih kelas pertama kalau ada
        if (!selectedClass && kelasRows && kelasRows.length > 0) {
          setSelectedClass(kelasRows[0].id)
        }
      } catch (err) {
        console.error('loadGuruAndClasses error:', err)
        setError(err.message || 'Gagal memuat data guru & kelas.')
      } finally {
        setLoading(false)
      }
    }

    loadGuruAndClasses()
  }, [user])

  const classMap = useMemo(() => {
    const map = new Map()
    classes.forEach((k) => {
      map.set(k.id, k.nama || `Kelas ${k.id?.slice(0, 4)}`)
    })
    return map
  }, [classes])

  // 2. Ambil siswa & absensi untuk kombinasi (kelas, tanggal)
  useEffect(() => {
    const loadStudentsAndAttendance = async () => {
      if (!guru || !selectedClass || !selectedDate) return

      try {
        setLoading(true)
        setError(null)

        // Siswa di kelas tersebut
        const { data: siswaRows, error: siswaError } = await supabase
          .from('siswas')
          .select('id, first_name, last_name, nisn')
          .eq('kelas_id', selectedClass)
          .order('first_name', { ascending: true })

        if (siswaError) {
          throw siswaError
        }

        setStudents(siswaRows || [])

        // Absensi existing untuk kelas & tanggal itu
        const { data: attendanceRows, error: attendanceError } = await supabase
          .from('attendance')
          .select('id, siswa_id, status, date')
          .eq('kelas_id', selectedClass)
          .eq('date', selectedDate)

        if (attendanceError) {
          throw attendanceError
        }

        const map = {}
        ;(attendanceRows || []).forEach((row) => {
          if (!row.siswa_id) return
          map[row.siswa_id] = row.status || ''
        })

        setAttendanceMap(map)
      } catch (err) {
        console.error('loadStudentsAndAttendance error:', err)
        setError(err.message || 'Gagal memuat data absensi.')
      } finally {
        setLoading(false)
      }
    }

    loadStudentsAndAttendance()
  }, [guru, selectedClass, selectedDate])

  const handleChangeStatus = (siswaId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [siswaId]: status
    }))
  }

  const handleSave = async () => {
    if (!guru || !selectedClass || !selectedDate) {
      toast.error('Guru, kelas, dan tanggal wajib dipilih.')
      return
    }

    if (!students.length) {
      toast.error('Tidak ada siswa di kelas ini.')
      return
    }

    try {
      setSaving(true)

      const tanggal = selectedDate.slice(0, 10)

      // Payload untuk UPSERT:
      // constraint di DB: attendance_unique_siswa_date (UNIQUE (siswa_id, date))
      // jadi onConflict HARUS persis 'siswa_id,date'
      const payload = students.map((s) => ({
        guru_id: guru.id,
        siswa_id: s.id,
        kelas_id: selectedClass,
        date: tanggal,
        status: attendanceMap[s.id] || 'hadir'
      }))

      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert(payload, {
          onConflict: 'siswa_id,date'
        })

      if (upsertError) {
        console.error('save attendance upsert error:', upsertError)
        throw upsertError
      }

      toast.success('Absensi berhasil disimpan / diperbarui.')

      // optional: reload dari DB supaya state selalu sinkron
      const { data: attendanceRows, error: attendanceError } = await supabase
        .from('attendance')
        .select('id, siswa_id, status, date')
        .eq('kelas_id', selectedClass)
        .eq('date', tanggal)

      if (!attendanceError) {
        const map = {}
        ;(attendanceRows || []).forEach((row) => {
          if (!row.siswa_id) return
          map[row.siswa_id] = row.status || ''
        })
        setAttendanceMap(map)
      }
    } catch (err) {
      console.error('handleSave error:', err)
      toast.error('Gagal menyimpan absensi.')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      if (!guru) {
        toast.error('Data guru belum siap.')
        return
      }
      if (!selectedDate) {
        toast.error('Pilih tanggal terlebih dahulu.')
        return
      }

      const rows = await fetchDailyAttendance({
        guruId: guru.id,
        date: selectedDate,
        kelasId: selectedClass || null
      })

      if (!rows.length) {
        toast.error('Tidak ada data absensi untuk tanggal tersebut.')
        return
      }

      const kelasName = selectedClass
        ? rows[0]?.kelas?.nama || 'kelas'
        : 'semua_kelas'

      downloadAttendanceAsCsv({
        rows,
        date: selectedDate,
        kelasName
      })

      toast.success('Absensi berhasil diekspor.')
    } catch (err) {
      console.error('Export absensi error:', err)
      toast.error('Gagal mengekspor absensi.')
    }
  }

  if (loading && !guru) {
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
          <h1 className="text-2xl font-bold text-gray-900">Absensi Siswa</h1>
          <p className="text-gray-600 mt-1">
            Kelola absensi harian berdasarkan kelas dan tanggal.
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

      {/* Filter Kelas & Tanggal + Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kelas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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

          {/* Tanggal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Tombol Export */}
          <div className="flex items-end justify-start md:justify-end">
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Export Absensi (CSV)
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabel Absensi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        {!selectedClass ? (
          <p className="text-sm text-gray-500">
            Pilih kelas terlebih dahulu.
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
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 px-3">
                        {s.first_name} {s.last_name || ''}
                      </td>
                      <td className="py-2 px-3">
                        {s.nisn || '-'}
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={attendanceMap[s.id] || ''}
                          onChange={(e) =>
                            handleChangeStatus(s.id, e.target.value)
                          }
                          className="border border-gray-300 rounded-lg px-2 py-1 text-xs md:text-sm"
                        >
                          <option value="">Pilih status</option>
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
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
                {saving ? 'Menyimpan...' : 'Simpan Absensi'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default Absensi
