import React from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useSiswaAttendance } from '../../hooks/useSiswaAttendance'

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const statusLabelClass = (status) => {
  switch (status) {
    case 'hadir':
      return 'bg-green-50 text-green-700'
    case 'alpha':
      return 'bg-red-50 text-red-700'
    case 'izin':
      return 'bg-blue-50 text-blue-700'
    case 'sakit':
      return 'bg-yellow-50 text-yellow-700'
    case 'telat':
      return 'bg-orange-50 text-orange-700'
    default:
      return 'bg-gray-50 text-gray-600'
  }
}

const AbsensiSiswa = () => {
  const {
    year,
    setYear,
    month,
    setMonth,
    monthOptions,
    yearOptions,
    records,
    summary,
    loading,
    error,
  } = useSiswaAttendance()

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
          <h1 className="text-2xl font-bold text-gray-900">Absensi</h1>
          <p className="text-gray-600 mt-1">
            Riwayat kehadiran per bulan
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Filter Bulan & Tahun */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-end gap-4"
      >
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bulan
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tahun
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total Hari</p>
          <p className="text-xl font-semibold text-gray-900">
            {summary.total}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Hadir</p>
          <p className="text-xl font-semibold text-green-700">
            {summary.hadir}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Alpha</p>
          <p className="text-xl font-semibold text-red-700">
            {summary.alpha}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Izin</p>
          <p className="text-xl font-semibold text-blue-700">
            {summary.izin}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Sakit</p>
          <p className="text-xl font-semibold text-yellow-700">
            {summary.sakit}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">% Kehadiran</p>
          <p className="text-xl font-semibold text-gray-900">
            {summary.presentaseHadir.toFixed(1)}%
          </p>
        </div>
      </motion.div>

      {/* Tabel Absensi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        {records.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Belum ada data absensi pada bulan ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3">Tanggal</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 px-3">{formatDate(r.date)}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs ${statusLabelClass(
                          r.status
                        )}`}
                      >
                        {r.status || '-'}
                      </span>
                    </td>
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

export default AbsensiSiswa
