// src/components/GradeChart.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase/supabaseClient'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import LoadingSpinner from './LoadingSpinner'

const TARGET_CLASSES_ORDER = ['7 1', '7 2', '8 1', '8 2', '9 1', '9 2']

const GradeChart = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // Ambil semua kelas
        const { data: kelasData, error: kelasError } = await supabase
          .from('classes')
          .select('id, nama')

        if (kelasError) throw kelasError

        // Ambil semua siswa beserta kelas_id
        const { data: siswaData, error: siswaError } = await supabase
          .from('siswas')
          .select('id, kelas_id')

        if (siswaError) throw siswaError

        // Hitung jumlah siswa per kelas_id
        const countPerKelasId = {}
        ;(siswaData || []).forEach((s) => {
          if (!s.kelas_id) return
          countPerKelasId[s.kelas_id] = (countPerKelasId[s.kelas_id] || 0) + 1
        })

        // Gabungkan ke label kelas (nama kelas)
        const countPerLabel = {}
        ;(kelasData || []).forEach((k) => {
          const total = countPerKelasId[k.id] || 0
          const label = k.nama || 'Tanpa Nama'
          countPerLabel[label] = (countPerLabel[label] || 0) + total
        })

        // Susun data untuk chart sesuai urutan SMP yang lu mau
        const chartData = TARGET_CLASSES_ORDER.map((label) => ({
          name: label,
          total: countPerLabel[label] || 0,
        }))

        setData(chartData)
      } catch (err) {
        console.error('GradeChart (jumlah siswa) error:', err)
        setError(err.message || 'Gagal memuat data jumlah siswa per kelas.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-15} textAnchor="end" interval={0} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="total" name="Jumlah Siswa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default GradeChart
