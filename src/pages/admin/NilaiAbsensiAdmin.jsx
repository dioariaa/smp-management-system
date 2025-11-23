import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'

const NilaiAbsensiAdmin = () => {
  const [gradesRaw, setGradesRaw] = useState([])
  const [attendanceRaw, setAttendanceRaw] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // filters
  const [selectedClass, setSelectedClass] = useState('all')
  const [searchName, setSearchName] = useState('')
  const [selectedMapel, setSelectedMapel] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // ====== Ambil semua nilai + info siswa & kelas ======
        const { data: grades, error: gradesError } = await supabase
          .from('grades')
          .select(`
            id,
            mapel,
            nilai,
            siswa:siswa_id (
              id,
              first_name,
              last_name,
              nisn,
              kelas:kelas_id (
                id,
                nama
              )
            )
          `)

        if (gradesError) throw gradesError

        // ====== Ambil absensi + info siswa & kelas ======
        const { data: attendance, error: attError } = await supabase
          .from('attendance')
          .select(`
            id,
            status,
            date,
            siswa:siswa_id (
              id,
              first_name,
              last_name,
              kelas:kelas_id (
                id,
                nama
              )
            )
          `)

        if (attError) throw attError

        setGradesRaw(grades || [])
        setAttendanceRaw(attendance || [])
      } catch (err) {
        console.error('Monitoring admin error:', err)
        setError('Gagal memuat data nilai & absensi.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // ====== OPTIONS FILTER (kelas & mapel) ======

  const classOptions = useMemo(() => {
    const map = new Map()
    gradesRaw.forEach((g) => {
      const kelas = g.siswa?.kelas
      if (kelas?.id && !map.has(kelas.id)) {
        map.set(kelas.id, kelas.nama || '(Tanpa nama)')
      }
    })
    attendanceRaw.forEach((a) => {
      const kelas = a.siswa?.kelas
      if (kelas?.id && !map.has(kelas.id)) {
        map.set(kelas.id, kelas.nama || '(Tanpa nama)')
      }
    })
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }))
  }, [gradesRaw, attendanceRaw])

  const mapelOptions = useMemo(() => {
    const set = new Set()
    gradesRaw.forEach((g) => {
      if (g.mapel) set.add(g.mapel)
    })
    return Array.from(set)
  }, [gradesRaw])

  // ====== FILTER DATA BERDASARKAN KELAS, NAMA, MAPEL ======

  const filteredGrades = useMemo(() => {
    const q = searchName.trim().toLowerCase()
    return gradesRaw.filter((g) => {
      const kelasId = g.siswa?.kelas?.id
      const fullName =
        `${g.siswa?.first_name || ''} ${g.siswa?.last_name || ''}`.trim().toLowerCase()

      const matchClass =
        selectedClass === 'all' || (kelasId && kelasId === selectedClass)

      const matchName = !q || fullName.includes(q)

      const matchMapel =
        selectedMapel === 'all' || g.mapel === selectedMapel

      return matchClass && matchName && matchMapel
    })
  }, [gradesRaw, selectedClass, searchName, selectedMapel])

  const filteredAttendance = useMemo(() => {
    const q = searchName.trim().toLowerCase()
    return attendanceRaw.filter((a) => {
      const kelasId = a.siswa?.kelas?.id
      const fullName =
        `${a.siswa?.first_name || ''} ${a.siswa?.last_name || ''}`.trim().toLowerCase()

      const matchClass =
        selectedClass === 'all' || (kelasId && kelasId === selectedClass)

      const matchName = !q || fullName.includes(q)

      return matchClass && matchName
    })
  }, [attendanceRaw, selectedClass, searchName])

  // ====== SUMMARY NILAI PER MAPEL (SETELAH FILTER) ======

  const gradeSummary = useMemo(() => {
    const map = {}
    filteredGrades.forEach((g) => {
      if (!g.mapel) return
      const n = Number(g.nilai || 0)
      if (!map[g.mapel]) map[g.mapel] = { total: 0, count: 0 }
      map[g.mapel].total += n
      map[g.mapel].count += 1
    })

    return Object.entries(map).map(([mapel, { total, count }]) => ({
      mapel,
      rata: count ? total / count : 0,
      jumlah: count,
    }))
  }, [filteredGrades])

  // ====== SUMMARY ABSENSI (SETELAH FILTER) ======

  const attendanceSummary = useMemo(() => {
    const total = filteredAttendance.length

    const countBy = (status) =>
      filteredAttendance.filter((a) => a.status === status).length

    const hadir = countBy('hadir')
    const alpha = countBy('alpha')
    const izin = countBy('izin')
    const sakit = countBy('sakit')
    const telat = countBy('telat')

    return {
      total,
      hadir,
      alpha,
      izin,
      sakit,
      telat,
    }
  }, [filteredAttendance])

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
          <h1 className="text-2xl font-bold text-gray-900">
            Monitoring Nilai & Absensi
          </h1>
          <p className="text-gray-600 mt-1">
            Pantau performa akademik dan kehadiran berdasarkan kelas & nama
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* FILTER BAR */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kelas
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Semua Kelas</option>
            {classOptions.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Siswa
          </label>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Cari nama siswa..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mata Pelajaran
          </label>
          <select
            value={selectedMapel}
            onChange={(e) => setSelectedMapel(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Semua Mapel</option>
            {mapelOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* SUMMARY ABSENSI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total Catatan</p>
          <p className="text-xl font-semibold text-gray-900">
            {attendanceSummary.total}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Hadir</p>
          <p className="text-xl font-semibold text-green-700">
            {attendanceSummary.hadir}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Alpha</p>
          <p className="text-xl font-semibold text-red-700">
            {attendanceSummary.alpha}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Izin</p>
          <p className="text-xl font-semibold text-blue-700">
            {attendanceSummary.izin}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Sakit</p>
          <p className="text-xl font-semibold text-yellow-700">
            {attendanceSummary.sakit}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">% Kehadiran (kasar)</p>
          <p className="text-xl font-semibold text-gray-900">
            {attendanceSummary.total
              ? (
                  (attendanceSummary.hadir / attendanceSummary.total) *
                  100
                ).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </motion.div>

      {/* TABEL NILAI PER MAPEL (SETELAH FILTER) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Rata-rata Nilai per Mata Pelajaran (berdasarkan filter)
        </h2>

        {gradeSummary.length === 0 ? (
          <p className="text-sm text-gray-500">
            Tidak ada data nilai untuk filter saat ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3">Mapel</th>
                  <th className="text-left py-2 px-3">Rata-rata</th>
                  <th className="text-left py-2 px-3">Jumlah Nilai</th>
                </tr>
              </thead>
              <tbody>
                {gradeSummary.map((g) => (
                  <tr key={g.mapel} className="border-b last:border-0">
                    <td className="py-2 px-3">{g.mapel}</td>
                    <td className="py-2 px-3">{g.rata.toFixed(1)}</td>
                    <td className="py-2 px-3">{g.jumlah}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* TABEL DETAIL ABSENSI (OPSIONAL, TAPI BERMANFAAT) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Detail Absensi (berdasarkan filter)
        </h2>

        {filteredAttendance.length === 0 ? (
          <p className="text-sm text-gray-500">
            Tidak ada data absensi untuk filter saat ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3">Tanggal</th>
                  <th className="text-left py-2 px-3">Nama</th>
                  <th className="text-left py-2 px-3">Kelas</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 px-3">
                      {a.date
                        ? new Date(a.date).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td className="py-2 px-3">
                      {`${a.siswa?.first_name || ''} ${
                        a.siswa?.last_name || ''
                      }`.trim() || '-'}
                    </td>
                    <td className="py-2 px-3">
                      {a.siswa?.kelas?.nama || '-'}
                    </td>
                    <td className="py-2 px-3">{a.status || '-'}</td>
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

export default NilaiAbsensiAdmin
