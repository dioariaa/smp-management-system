import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/LoadingSpinner'

const TIPE_LABEL = {
  tugas_harian: 'Tugas Harian',
  uts: 'UTS',
  uas: 'UAS',
}

const NilaiSiswa = () => {
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [siswa, setSiswa] = useState(null)
  const [grades, setGrades] = useState([])

  const [selectedMapel, setSelectedMapel] = useState('')
  const [selectedTipe, setSelectedTipe] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) {
          setLoading(false)
          return
        }

        setLoading(true)
        setError(null)

        // 1. Ambil data siswa dari user_id
        const { data: siswaRow, error: siswaError } = await supabase
          .from('siswas')
          .select(`
            id,
            first_name,
            last_name,
            kelas:kelas_id (
              id,
              nama
            )
          `)
          .eq('user_id', user.id)
          .single()

        if (siswaError || !siswaRow) {
          throw new Error('Data siswa tidak ditemukan.')
        }

        setSiswa(siswaRow)

        // 2. Ambil nilai siswa
        const { data: gradeRows, error: gradeError } = await supabase
          .from('grades')
          .select('id, nilai, tanggal, mapel, tipe')
          .eq('siswa_id', siswaRow.id)
          .order('tanggal', { ascending: false })

        if (gradeError) throw gradeError

        setGrades(gradeRows || [])
      } catch (err) {
        console.error('NilaiSiswa load error:', err)
        setError(err.message || 'Gagal memuat data nilai.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const mapelList = useMemo(() => {
    const set = new Set()
    grades.forEach((g) => {
      if (g.mapel) set.add(g.mapel)
    })
    return Array.from(set)
  }, [grades])

  const filteredGrades = useMemo(() => {
    return (grades || []).filter((g) => {
      if (selectedMapel && g.mapel !== selectedMapel) return false
      if (selectedTipe && g.tipe !== selectedTipe) return false
      return true
    })
  }, [grades, selectedMapel, selectedTipe])

  const summaryByMapel = useMemo(() => {
    const map = new Map()
    grades.forEach((g) => {
      if (!g.mapel || g.nilai == null) return
      if (!map.has(g.mapel)) {
        map.set(g.mapel, { total: 0, count: 0 })
      }
      const obj = map.get(g.mapel)
      obj.total += g.nilai
      obj.count += 1
    })
    return Array.from(map.entries()).map(([mapel, { total, count }]) => ({
      mapel,
      rata: count ? Math.round(total / count) : 0
    }))
  }, [grades])

  if (loading && !siswa) {
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
            Nilai Saya
          </h1>
          <p className="text-gray-600 mt-1">
            Lihat nilai berdasarkan mata pelajaran dan tipe nilai.
          </p>
          {siswa && (
            <p className="text-xs text-gray-500 mt-1">
              {siswa.first_name} {siswa.last_name || ''} –{' '}
              {siswa.kelas?.nama || 'Kelas tidak diketahui'}
            </p>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Ringkasan rata-rata per mapel */}
      {summaryByMapel.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {summaryByMapel.map((item) => (
            <div
              key={item.mapel}
              className="bg-white rounded-xl shadow-sm p-4"
            >
              <p className="text-xs font-medium text-gray-500">
                Rata-rata {item.mapel}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {item.rata}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Filter mapel & tipe */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mata Pelajaran
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              {mapelList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tipe Nilai
            </label>
            <select
              value={selectedTipe}
              onChange={(e) => setSelectedTipe(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Semua</option>
              <option value="tugas_harian">Tugas Harian</option>
              <option value="uts">UTS</option>
              <option value="uas">UAS</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Tabel detail nilai */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        {!grades.length ? (
          <p className="text-sm text-gray-500">
            Belum ada nilai yang tercatat.
          </p>
        ) : !filteredGrades.length ? (
          <p className="text-sm text-gray-500">
            Tidak ada nilai yang cocok dengan filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3">Tanggal</th>
                  <th className="text-left py-2 px-3">Mapel</th>
                  <th className="text-left py-2 px-3">Tipe Nilai</th>
                  <th className="text-left py-2 px-3">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((g) => (
                  <tr key={g.id} className="border-b last:border-0">
                    <td className="py-2 px-3">
                      {g.tanggal
                        ? new Date(g.tanggal).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td className="py-2 px-3">{g.mapel || '-'}</td>
                    <td className="py-2 px-3">
                      {TIPE_LABEL[g.tipe] || g.tipe || '-'}
                    </td>
                    <td className="py-2 px-3">{g.nilai ?? '-'}</td>
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

export default NilaiSiswa
