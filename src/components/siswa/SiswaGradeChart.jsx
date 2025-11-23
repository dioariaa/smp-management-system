// src/components/siswa/SiswaGradeChart.jsx
import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

const SiswaGradeChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm">Belum ada data nilai.</p>
  }

  const chartData = data.map((row) => ({
    mapel: row.mapel,
    rata: Number(row.rata?.toFixed(1) || 0),
  }))

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="mapel" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="rata" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SiswaGradeChart
