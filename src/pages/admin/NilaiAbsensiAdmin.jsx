import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Search } from 'lucide-react'

const TIPE_OPTIONS = [
  { value: '', label: 'Semua Tipe' },
  { value: 'tugas_harian', label: 'Tugas Harian' },
  { value: 'uts', label: 'UTS' },
  { value: 'uas', label: 'UAS' },
]

const TIPE_LABEL = {
  tugas_harian: 'Tugas Harian',
  uts: 'UTS',
  uas: 'UAS',
}

const STATUS_PRIORITY = {
  alpa: 3,
  sakit: 2,
  izin: 1,
  hadir: 0,
}

const NilaiAbsensiAdmin = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTipe, setSelectedTipe] = useState('')
  const [searchName, setSearchName] = useState('')

  // filter tanggal (range)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [nilaiRows, setNilaiRows] = useState([])
  const [absensiRows, setAbsensiRows] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Ambil data kelas
        const { data: kelasData, error: kelasError } = await supabase
          .from('classes')
          .select('id, nama')
          .order('nama', { ascending: true })

        if (kelasError) throw kelasError
        setClasses(kelasData || [])

        // 2. Ambil data nilai (grades per siswa)
        const { data: nilaiData, error: nilaiError } = await supabase
          .from('grades')
          .select(`
            id,
            nilai,
            tanggal,
            mapel,
            tipe,
            siswa:siswa_id (
              id,
              first_name,
              last_name
            ),
            kelas:kelas_id (
              id,
              nama
            )
          `)
          .order('tanggal', { ascending: false })

        if (nilaiError) throw nilaiError
        setNilaiRows(nilaiData || [])

        // 3. Ambil data absensi (attendance per siswa)
        const { data: absensiData, error: absensiError } = await supabase
          .from('attendance')
          .select(`
            id,
            date,
            status,
            siswa:siswa_id (
              id,
              first_name,
              last_name
            ),
            kelas:kelas_id (
              id,
              nama
            )
          `)
          .order('date', { ascending: false })

        if (absensiError) throw absensiError
        setAbsensiRows(absensiData || [])
      } catch (err) {
        console.error('NilaiAbsensiAdmin load error:', err)
        setError(err.message || 'Gagal memuat data monitoring.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const classMap = useMemo(() => {
    const map = new Map()
    classes.forEach((k) => {
      map.set(k.id, k.nama || `Kelas ${k.id?.slice(0, 4)}`)
    })
    return map
  }, [classes])

  const isInDateRange = (rawDate) => {
    if (!rawDate) return false
    const d = rawDate.slice(0, 10) // YYYY-MM-DD

    if (startDate && d < startDate) return false
    if (endDate && d > endDate) return false
    return true
  }

  const filteredNilai = useMemo(() => {
    const namaFilter = searchName.trim().toLowerCase()
    return (nilaiRows || [])
      .filter((row) => {
        if (selectedClass && row.kelas?.id !== selectedClass) return false
        if (selectedTipe && row.tipe !== selectedTipe) return false

        if (startDate || endDate) {
          if (!isInDateRange(row.tanggal || '')) return false
        }

        if (namaFilter) {
          const nama = `${row.siswa?.first_name || ''} ${row.siswa?.last_name || ''}`.toLowerCase()
          if (!nama.includes(namaFilter)) return false
        }
        return true
      })
      .sort((a, b) => {
        const ka = a.kelas?.nama || ''
        const kb = b.kelas?.nama || ''
        if (ka !== kb) return ka.localeCompare(kb)
        const na = `${a.siswa?.first_name || ''} ${a.siswa?.last_name || ''}`
        const nb = `${b.siswa?.first_name || ''} ${b.siswa?.last_name || ''}`
        return na.localeCompare(nb)
      })
  }, [nilaiRows, selectedClass, selectedTipe, searchName, startDate, endDate])

  const filteredAbsensi = useMemo(() => {
    const namaFilter = searchName.trim().toLowerCase()

    // 1. Filter biasa
    const filtered = (absensiRows || []).filter((row) => {
      if (selectedClass && row.kelas?.id !== selectedClass) return false

      if (startDate || endDate) {
        if (!isInDateRange(row.date || '')) return false
      }

      if (namaFilter) {
        const nama = `${row.siswa?.first_name || ''} ${row.siswa?.last_name || ''}`.toLowerCase()
        if (!nama.includes(namaFilter)) return false
      }
      return true
    })

    // 2. Group by (siswa_id + date) untuk hilangin duplikat
    const grouped = new Map()

    for (const row of filtered) {
      const siswaId = row.siswa?.id || row.siswa_id || 'no-siswa'
      const dateKey = (row.date || '').slice(0, 10)
      if (!dateKey) continue

      const key = `${siswaId}-${dateKey}`

      if (!grouped.has(key)) {
        grouped.set(key, row)
      } else {
        const existing = grouped.get(key)
        const sExisting = (existing.status || '').toLowerCase()
        const sNew = (row.status || '').toLowerCase()
        const pExisting = STATUS_PRIORITY[sExisting] ?? 0
        const pNew = STATUS_PRIORITY[sNew] ?? 0

        // kalau status baru "lebih berat", ganti
        if (pNew > pExisting) {
          grouped.set(key, row)
        }
      }
    }

    // 3. Balikin dalam bentuk array + sorting
    const uniqueRows = Array.from(grouped.values())

    return uniqueRows.sort((a, b) => {
      const ka = a.kelas?.nama || ''
      const kb = b.kelas?.nama || ''
      if (ka !== kb) return ka.localeCompare(kb)

      const na = `${a.siswa?.first_name || ''} ${a.siswa?.last_name || ''}`
      const nb = `${b.siswa?.first_name || ''} ${b.siswa?.last_name || ''}`
      if (na !== nb) return na.localeCompare(nb)

      const da = (a.date || '').slice(0, 10)
      const db = (b.date || '').slice(0, 10)
      return da.localeCompare(db)
    })
  }, [absensiRows, selectedClass, searchName, startDate, endDate])

  if (loading && !nilaiRows.length && !absensiRows.length) {
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
          <h1 className="text-2xl font-bold text-gray-900">
            Monitoring Nilai & Absensi
          </h1>
          <p className="text-gray-600 mt-1">
            Pantau nilai dan kehadiran siswa secara terpusat, per nama dan per tanggal.
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Filter Bar (kelas + tipe + tanggal + nama) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter Kelas */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">
              Kelas:
            </span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              {classes.map((k) => (
                <option key={k.id} value={k.id}>
                  {classMap.get(k.id)}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tipe Nilai */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">
              Tipe Nilai:
            </span>
            <select
              value={selectedTipe}
              onChange={(e) => setSelectedTipe(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {TIPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tanggal (range) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">
              Tanggal:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
            />
            <span className="text-xs text-gray-500">sampai</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
            />
          </div>
        </div>

        {/* Search Nama */}
        <div className="flex items-center gap-2 w-full md:w-80">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </motion.div>

      {/* Dua kolom: Nilai per siswa & Absensi per siswa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitoring Nilai per Siswa */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Nilai per Siswa
          </h2>

          {!filteredNilai.length ? (
            <p className="text-sm text-gray-500">
              Belum ada data nilai yang cocok dengan filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3">Nama</th>
                    <th className="text-left py-2 px-3">Kelas</th>
                    <th className="text-left py-2 px-3">Mapel</th>
                    <th className="text-left py-2 px-3">Tipe</th>
                    <th className="text-left py-2 px-3">Nilai</th>
                    <th className="text-left py-2 px-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNilai.map((row) => {
                    const nama = `${row.siswa?.first_name || ''} ${row.siswa?.last_name || ''}`.trim()
                    const kelasNama =
                      row.kelas?.nama ||
                      classMap.get(row.kelas_id) ||
                      '-'
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-2 px-3">{nama || '-'}</td>
                        <td className="py-2 px-3">{kelasNama}</td>
                        <td className="py-2 px-3">{row.mapel || '-'}</td>
                        <td className="py-2 px-3">
                          {TIPE_LABEL[row.tipe] || row.tipe || '-'}
                        </td>
                        <td className="py-2 px-3">{row.nilai ?? '-'}</td>
                        <td className="py-2 px-3">
                          {row.tanggal
                            ? new Date(row.tanggal).toLocaleDateString('id-ID')
                            : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Monitoring Absensi per Siswa */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Absensi per Siswa (tanpa duplikat per hari)
          </h2>

          {!filteredAbsensi.length ? (
            <p className="text-sm text-gray-500">
              Belum ada data absensi yang cocok dengan filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3">Nama</th>
                    <th className="text-left py-2 px-3">Kelas</th>
                    <th className="text-left py-2 px-3">Tanggal</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbsensi.map((row) => {
                    const nama = `${row.siswa?.first_name || ''} ${row.siswa?.last_name || ''}`.trim()
                    const kelasNama =
                      row.kelas?.nama ||
                      classMap.get(row.kelas_id) ||
                      '-'
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-2 px-3">{nama || '-'}</td>
                        <td className="py-2 px-3">{kelasNama}</td>
                        <td className="py-2 px-3">
                          {row.date
                            ? new Date(row.date).toLocaleDateString('id-ID')
                            : '-'}
                        </td>
                        <td className="py-2 px-3 capitalize">
                          {row.status || '-'}
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
    </div>
  )
}

export default NilaiAbsensiAdmin
