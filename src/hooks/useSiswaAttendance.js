// src/hooks/useSiswaAttendance.js
import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { fetchSiswaAttendanceByMonth } from '../services/siswaAttendanceService'

const now = new Date()
const THIS_YEAR = now.getFullYear()
const THIS_MONTH = now.getMonth() + 1

export const useSiswaAttendance = () => {
  const { user } = useAuthStore()

  const [year, setYear] = useState(THIS_YEAR)
  const [month, setMonth] = useState(THIS_MONTH)
  const [records, setRecords] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async (y, m) => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { records: data } = await fetchSiswaAttendanceByMonth(user.id, y, m)
      setRecords(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Gagal memuat absensi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(year, month)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, year, month])

  // summary statistik
  const summary = useMemo(() => {
    const total = records.length
    if (!total) {
      return {
        total,
        hadir: 0,
        alpha: 0,
        izin: 0,
        sakit: 0,
        telat: 0,
        presentaseHadir: 0,
      }
    }

    const countBy = (status) =>
      records.filter((r) => r.status === status).length

    const hadir = countBy('hadir')
    const alpha = countBy('alpha')
    const izin = countBy('izin')
    const sakit = countBy('sakit')
    const telat = countBy('telat')

    const presentaseHadir = (hadir / total) * 100

    return {
      total,
      hadir,
      alpha,
      izin,
      sakit,
      telat,
      presentaseHadir,
    }
  }, [records])

  const monthOptions = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ]

  const yearOptions = []
  for (let y = THIS_YEAR - 2; y <= THIS_YEAR + 1; y++) {
    yearOptions.push(y)
  }

  return {
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
  }
}
