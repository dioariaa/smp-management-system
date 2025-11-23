import { useEffect, useState } from 'react'
import { supabase } from '../supabase/supabaseClient'
import { getDashboardStats, getRecentActivity } from '../services/adminDashboardService'

export const useAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalGuru: 0,
    totalKelas: 0,
    activeEvents: 0,
  })

  const [activity, setActivity] = useState([])

  const refresh = async () => {
    const result = await getDashboardStats()
    setStats(prev => ({
      ...prev,
      ...result,
    }))

    const logs = await getRecentActivity()
    setActivity(logs)
  }

  useEffect(() => {
    refresh()

    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'siswas' },
        () => refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gurus' },
        () => refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classes' },
        () => refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_logs' },
        () => refresh()
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return { stats, activity }
}
