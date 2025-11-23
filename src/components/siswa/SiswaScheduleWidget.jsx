import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../LoadingSpinner'

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

function getTodayHari() {
  const hari = new Date().toLocaleDateString('id-ID', { weekday: 'long' })
  // jadwal.hari kita pakai kapital di awal, misal "Senin"
  return hari.charAt(0).toUpperCase() + hari.slice(1)
}

const SiswaScheduleWidget = () => {
  const { user } = useAuthStore()
  const [kelasId, setKelasId] = useState(null)
  const [jadwal, setJadwal] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)

        // 1. Ambil kelas siswa dari tabel siswas
        const { data: siswa, error: siswaError } = await supabase
          .from('siswas')
          .select('id, kelas_id')
          .eq('user_id', user.id)
          .single()

        if (siswaError || !siswa) {
          throw new Error('Data siswa tidak ditemukan')
        }

        if (!siswa.kelas_id) {
          throw new Error('Siswa belum terhubung ke kelas manapun')
        }

        setKelasId(siswa.kelas_id)

        // 2. Ambil jadwal untuk kelas ini
        const { data: jadwalRows, error: jadwalError } = await supabase
          .from('jadwal')
          .select(`
            id,
            hari,
            jam_mulai,
            jam_selesai,
            mapel,
            ruangan,
            guru:guru_id (
              id,
              first_name,
              last_name
            )
          `)
          .eq('kelas_id', siswa.kelas_id)

        if (jadwalError) throw jadwalError

        setJadwal(jadwalRows || [])
      } catch (err) {
        console.error('SiswaScheduleWidget error:', err)
        setError(err.message || 'Gagal memuat jadwal.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const today = getTodayHari()

  const todaySchedule = useMemo(
    () =>
      jadwal
        .filter((j) => j.hari === today)
        .sort((a, b) =>
          (a.jam_mulai || '').localeCompare(b.jam_mulai || '')
        ),
    [jadwal, today]
  )

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Jadwal Hari Ini ({today})
        </h2>
      </div>

      {(!todaySchedule || todaySchedule.length === 0) ? (
        <p className="text-sm text-gray-500">
          Tidak ada jadwal pelajaran untuk hari ini.
        </p>
      ) : (
        <div className="space-y-2">
          {todaySchedule.map((j) => (
            <div
              key={j.id}
              className="flex items-center justify-between border-b last:border-0 pb-2"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {j.mapel || '-'}
                </p>
                <p className="text-xs text-gray-500">
                  {j.guru
                    ? `${j.guru.first_name || ''} ${j.guru.last_name || ''}`
                    : 'Guru ?'}
                  {j.ruangan ? ` • ${j.ruangan}` : ''}
                </p>
              </div>
              <div className="text-xs text-gray-700">
                {(j.jam_mulai || '').slice(0, 5)} -{' '}
                {(j.jam_selesai || '').slice(0, 5)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SiswaScheduleWidget
