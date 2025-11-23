import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

const JadwalMengajar = () => {
  const { user } = useAuthStore()
  const [guru, setGuru] = useState(null)
  const [jadwal, setJadwal] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedHari, setSelectedHari] = useState('all')

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 1. Ambil data guru berdasarkan user_id
        const { data: guruRow, error: guruError } = await supabase
          .from('gurus')
          .select('id, first_name, last_name')
          .eq('user_id', user.id)
          .single()

        if (guruError || !guruRow) {
          throw new Error('Data guru tidak ditemukan')
        }

        setGuru(guruRow)

        // 2. Ambil jadwal mengajar guru ini
        const { data: jadwalData, error: jadwalError } = await supabase
          .from('jadwal')
          .select(`
            id,
            hari,
            jam_mulai,
            jam_selesai,
            mapel,
            ruangan,
            kelas:kelas_id (
              id,
              nama
            )
          `)
          .eq('guru_id', guruRow.id)
          .order('hari', { ascending: true })
          .order('jam_mulai', { ascending: true })

        if (jadwalError) throw jadwalError

        setJadwal(jadwalData || [])
      } catch (err) {
        console.error('Jadwal mengajar guru error:', err)
        setError(err.message || 'Gagal memuat jadwal mengajar.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const groupedByHari = useMemo(() => {
    const group = {}
    HARI_ORDER.forEach((h) => {
      group[h] = []
    })
    jadwal.forEach((j) => {
      if (!group[j.hari]) group[j.hari] = []
      group[j.hari].push(j)
    })
    return group
  }, [jadwal])

  const visibleDays =
    selectedHari === 'all'
      ? HARI_ORDER
      : HARI_ORDER.filter((h) => h === selectedHari)

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
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Mengajar</h1>
          <p className="text-gray-600 mt-1">
            Jadwal mengajar berdasarkan hari dan kelas
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

      {/* Filter hari */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-2"
      >
        <button
          onClick={() => setSelectedHari('all')}
          className={`px-3 py-1 rounded-full text-xs md:text-sm border ${
            selectedHari === 'all'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Semua Hari
        </button>
        {HARI_ORDER.map((h) => (
          <button
            key={h}
            onClick={() => setSelectedHari(h)}
            className={`px-3 py-1 rounded-full text-xs md:text-sm border ${
              selectedHari === h
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {h}
          </button>
        ))}
      </motion.div>

      {/* List jadwal per hari */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {visibleDays.map((hari) => {
          const list = groupedByHari[hari] || []
          if (!list.length && selectedHari !== 'all') {
            // kalau filter spesifik hari dan kosong, tetap tampil pesan
            return (
              <div
                key={hari}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                <h2 className="text-sm font-semibold text-gray-800 mb-2">
                  {hari}
                </h2>
                <p className="text-xs text-gray-500">
                  Tidak ada jadwal mengajar pada hari ini.
                </p>
              </div>
            )
          }
          if (!list.length && selectedHari === 'all') {
            // kalau mode semua hari, skip hari yang kosong
            return null
          }
          return (
            <div
              key={hari}
              className="bg-white rounded-xl shadow-sm p-4"
            >
              <h2 className="text-sm font-semibold text-gray-800 mb-2">
                {hari}
              </h2>
              <div className="space-y-2">
                {list.map((j) => (
                  <div
                    key={j.id}
                    className="flex items-center justify-between border-b last:border-0 pb-2"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {j.mapel || '-'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {j.kelas?.nama || 'Kelas ?'}
                        {j.ruangan ? ` • ${j.ruangan}` : ''}
                      </p>
                    </div>
                    <div className="text-xs md:text-sm text-gray-700">
                      {(j.jam_mulai || '').slice(0, 5)} -{' '}
                      {(j.jam_selesai || '').slice(0, 5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {jadwal.length === 0 && (
          <p className="text-sm text-gray-500">
            Belum ada jadwal mengajar yang terdaftar untuk guru ini.
          </p>
        )}
      </motion.div>
    </div>
  )
}

export default JadwalMengajar
