// src/components/siswa/SiswaAttendanceChart.jsx
import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

const dayLabel = (dateStr) => {
  const d = new Date(dateStr)
  const day = d.getDay() // 0-6
  const map = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  return map[day] || ''
}

const SiswaAttendanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm">Belum ada data absensi minggu ini.</p>
  }

  const chartData = data.map((row) => ({
    day: dayLabel(row.date),
    score: row.status === 'hadir' ? 1 : 0,
    status: row.status,
  }))

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="day" />
          <YAxis
            ticks={[0, 1]}
            domain={[0, 1]}
          />
          <Tooltip />
          <Bar dataKey="score" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SiswaAttendanceChart
