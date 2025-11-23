import React from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useSiswaJadwal } from '../../hooks/useSiswaJadwal'

const JadwalSiswa = () => {
  const {
    days,
    selectedHari,
    setSelectedHari,
    jadwalHariIni,
    loading,
    error,
  } = useSiswaJadwal()

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
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Pelajaran</h1>
          <p className="text-gray-600 mt-1">
            Lihat jadwal berdasarkan hari
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Selector hari */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-2"
      >
        {days.map((hari) => (
          <button
            key={hari}
            onClick={() => setSelectedHari(hari)}
            className={`px-3 py-1 rounded-full text-sm border ${
              selectedHari === hari
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {hari}
          </button>
        ))}
      </motion.div>

      {/* Jadwal per hari */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4"
      >
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Jadwal Hari {selectedHari || '-'}
        </h2>

        {(!jadwalHariIni || jadwalHariIni.length === 0) ? (
          <p className="text-gray-500 text-sm">
            Tidak ada jadwal pada hari ini.
          </p>
        ) : (
          <div className="space-y-3">
            {jadwalHariIni.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b last:border-0 pb-2"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {item.mapel}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.guru
                      ? `${item.guru.first_name} ${item.guru.last_name || ''}`
                      : 'Guru'}
                    {item.ruangan ? ` • ${item.ruangan}` : ''}
                  </p>
                </div>
                <div className="text-sm text-gray-700">
                  {item.jam_mulai?.slice(0, 5)} - {item.jam_selesai?.slice(0, 5)}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default JadwalSiswa
