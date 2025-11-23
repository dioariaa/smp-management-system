import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

const JadwalAdmin = () => {
  const [jadwal, setJadwal] = useState([])
  const [kelasList, setKelasList] = useState([])
  const [guruList, setGuruList] = useState([])

  const [selectedKelas, setSelectedKelas] = useState('all')
  const [selectedHari, setSelectedHari] = useState('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // Ambil semua kelas
        const { data: classes, error: kelasError } = await supabase
          .from('classes')
          .select('*')
          .order('nama', { ascending: true })
          .limit(200)

        if (kelasError) throw kelasError

        // Ambil semua guru
        const { data: gurus, error: guruError } = await supabase
          .from('gurus')
          .select('*')
          .order('first_name', { ascending: true })
          .limit(500)

        if (guruError) throw guruError

        // Ambil semua jadwal
        const { data: jadwalData, error: jadwalError } = await supabase
          .from('jadwal')
          .select('*')
          .order('hari', { ascending: true })
          .order('jam_mulai', { ascending: true })

        if (jadwalError) throw jadwalError

        setKelasList(classes || [])
        setGuruList(gurus || [])
        setJadwal(jadwalData || [])
      } catch (err) {
        console.error('Jadwal admin error:', err)
        setError('Gagal memuat jadwal.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const kelasMap = useMemo(() => {
    const map = new Map()
    kelasList.forEach((k) => {
      const name =
        k.nama ||
        k.name ||
        k.kode ||
        k.kode_kelas ||
        `Kelas ${k.id?.slice(0, 4) || ''}`
      map.set(k.id, name)
    })
    return map
  }, [kelasList])

  const guruMap = useMemo(() => {
    const map = new Map()
    guruList.forEach((g) => {
      const fullName =
        (g.first_name || g.nama || '') +
        (g.last_name ? ` ${g.last_name}` : '')
      map.set(g.id, fullName.trim() || `Guru ${g.id?.slice(0, 4) || ''}`)
    })
    return map
  }, [guruList])

  // filter jadwal
  const filteredJadwal = useMemo(() => {
    return jadwal
      .filter((j) => {
        const matchKelas =
          selectedKelas === 'all' ||
          (j.kelas_id && j.kelas_id === selectedKelas)
        const matchHari =
          selectedHari === 'all' ||
          (j.hari && j.hari === selectedHari)
        return matchKelas && matchHari
      })
      .sort((a, b) => {
        const idxA = HARI_ORDER.indexOf(a.hari)
        const idxB = HARI_ORDER.indexOf(b.hari)
        if (idxA !== idxB) return idxA - idxB
        return (a.jam_mulai || '').localeCompare(b.jam_mulai || '')
      })
  }, [jadwal, selectedKelas, selectedHari])

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
            Manajemen Jadwal
          </h1>
          <p className="text-gray-600 mt-1">
            Lihat jadwal seluruh kelas dan filter berdasarkan kelas & hari.
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Filter bar */}
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
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {kelasMap.get(k.id)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hari
          </label>
          <select
            value={selectedHari}
            onChange={(e) => setSelectedHari(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Semua Hari</option>
            {HARI_ORDER.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Tabel jadwal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        {filteredJadwal.length === 0 ? (
          <p className="text-sm text-gray-500">
            Tidak ada jadwal untuk filter saat ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3">Kelas</th>
                  <th className="text-left py-2 px-3">Hari</th>
                  <th className="text-left py-2 px-3">Jam</th>
                  <th className="text-left py-2 px-3">Mapel</th>
                  <th className="text-left py-2 px-3">Guru</th>
                  <th className="text-left py-2 px-3">Ruangan</th>
                </tr>
              </thead>
              <tbody>
                {filteredJadwal.map((j) => (
                  <tr key={j.id} className="border-b last:border-0">
                    <td className="py-2 px-3">
                      {kelasMap.get(j.kelas_id) || '-'}
                    </td>
                    <td className="py-2 px-3">{j.hari || '-'}</td>
                    <td className="py-2 px-3">
                      {(j.jam_mulai || '').slice(0, 5)} -{' '}
                      {(j.jam_selesai || '').slice(0, 5)}
                    </td>
                    <td className="py-2 px-3">{j.mapel || '-'}</td>
                    <td className="py-2 px-3">
                      {guruMap.get(j.guru_id) || '-'}
                    </td>
                    <td className="py-2 px-3">{j.ruangan || '-'}</td>
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
