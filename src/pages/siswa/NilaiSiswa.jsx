import React from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useSiswaGrades } from '../../hooks/useSiswaGrades'

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID')
}

const formatNumber = (v) => {
  if (!v && v !== 0) return '-'
  return Number(v).toFixed(1)
}

const NilaiSiswa = () => {
  const {
    filteredGrades,
    loading,
    error,
    mapelOptions,
    selectedMapel,
    setSelectedMapel,
    kkm,
    setKkm,
    summary,
  } = useSiswaGrades()

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
          <h1 className="text-2xl font-bold text-gray-900">Nilai</h1>
          <p className="text-gray-600 mt-1">
            Lihat nilai per mata pelajaran dan statistik ringkas
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Filter + KKM */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-end gap-4"
      >
        <div className="flex-1">
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

       <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    KKM
  </label>
  <input
    type="number"
    value={kkm}
    readOnly
    className="w-24 border border-gray-300 bg-gray-100 text-gray-600 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
  />
</div>

      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Jumlah Nilai</p>
          <p className="text-xl font-semibold text-gray-900">
            {summary.count}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Rata-rata</p>
          <p className="text-xl font-semibold text-gray-900">
            {formatNumber(summary.avg)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Tertinggi</p>
          <p className="text-xl font-semibold text-gray-900">
            {summary.max || summary.max === 0 ? summary.max : '-'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Di bawah KKM</p>
          <p className="text-xl font-semibold text-gray-900">
            {summary.belowKkm}
          </p>
        </div>
      </motion.div>

      {/* Tabel Nilai */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        {filteredGrades.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Belum ada nilai untuk filter saat ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3">Tanggal</th>
                  <th className="text-left py-2 px-3">Mata Pelajaran</th>
                  <th className="text-left py-2 px-3">Guru</th>
                  <th className="text-left py-2 px-3">Nilai</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((g) => {
                  const nilaiNum = Number(g.nilai || 0)
                  const isBelow = nilaiNum < kkm
                  return (
                    <tr key={g.id} className="border-b last:border-0">
                      <td className="py-2 px-3">
                        {formatDate(g.tanggal)}
                      </td>
                      <td className="py-2 px-3">{g.mapel || '-'}</td>
                      <td className="py-2 px-3">
                        {g.guru
                          ? `${g.guru.first_name} ${g.guru.last_name || ''}`
                          : '-'}
                      </td>
                      <td className="py-2 px-3">{nilaiNum}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs ${
                            isBelow
                              ? 'bg-red-50 text-red-700'
                              : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {isBelow ? 'Di bawah KKM' : 'Lulus'}
                        </span>
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
  )
}

export default NilaiSiswa
