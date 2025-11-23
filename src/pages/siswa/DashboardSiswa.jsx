import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/LoadingSpinner'
import SiswaAttendanceChart from '../../components/siswa/SiswaAttendanceChart'
import SiswaScheduleWidget from '../../components/siswa/SiswaScheduleWidget'
import RealtimeAnnouncements from '../../components/RealtimeAnnouncements'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'

const DashboardSiswa = () => {
  const { user, profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [siswa, setSiswa] = useState(null)
  const [gradeData, setGradeData] = useState([])

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 1. Ambil data siswa berdasarkan user_id
        const { data: siswaRow, error: siswaError } = await supabase
          .from('siswas')
          .select('id, first_name, last_name, kelas_id')
          .eq('user_id', user.id)
          .single()

        if (siswaError || !siswaRow) {
          throw new Error('Data siswa tidak ditemukan')
        }

        setSiswa(siswaRow)

        // 2. Ambil semua nilai siswa ini
        const { data: grades, error: gradesError } = await supabase
          .from('grades')
          .select('mapel, nilai')
          .eq('siswa_id', siswaRow.id)

        if (gradesError) {
          throw gradesError
        }

        // Kelompokkan rata-rata nilai per mapel
        const map = new Map()
        ;(grades || []).forEach((g) => {
          if (!g.mapel) return
          const key = g.mapel
          if (!map.has(key)) {
            map.set(key, { mapel: key, total: 0, count: 0 })
          }
          const row = map.get(key)
          row.total += g.nilai || 0
          row.count += 1
        })

        const chartData = Array.from(map.values()).map((row) => ({
          mapel: row.mapel,
          rataNilai: row.count ? Math.round(row.total / row.count) : 0
        }))

        setGradeData(chartData)
      } catch (err) {
        console.error('Dashboard siswa error:', err)
        setError(err.message || 'Gagal memuat data dashboard.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const rataRataNilai = useMemo(() => {
    if (!gradeData.length) return null
    const total = gradeData.reduce((sum, g) => sum + g.rataNilai, 0)
    return Math.round(total / gradeData.length)
  }, [gradeData])

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
            Dashboard Siswa
          </h1>
          <p className="text-gray-600 mt-1">
            Selamat datang{', '}
            {siswa
              ? `${siswa.first_name} ${siswa.last_name || ''}`
              : profile?.full_name || ''}
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Ringkasan Singkat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">Rata-rata Nilai</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {rataRataNilai !== null ? rataRataNilai : '-'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">Jumlah Mapel Dinilai</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {gradeData.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">Kelas</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {profile?.kelas_nama || '-'}
          </p>
        </div>
      </motion.div>

      {/* Chart & Jadwal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Kehadiran Mingguan */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Kehadiran Mingguan
          </h2>
          <SiswaAttendanceChart />
        </motion.div>

        {/* Jadwal Hari Ini */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <SiswaScheduleWidget />
        </motion.div>
      </div>

      {/* Chart Nilai per Mapel & Pengumuman */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Nilai Per Mapel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Rata-rata Nilai per Mapel
          </h2>
          {gradeData.length === 0 ? (
            <p className="text-sm text-gray-500">
              Belum ada data nilai.
            </p>
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mapel" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rataNilai" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Pengumuman */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-4"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Pengumuman Terbaru
          </h2>
          <RealtimeAnnouncements />
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardSiswa
