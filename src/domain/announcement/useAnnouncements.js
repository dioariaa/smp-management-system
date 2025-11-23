import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { getAnnouncements, saveAnnouncement, deleteAnnouncement } from './announcementService'

export const useAnnouncements = () => {
  const { role, user } = useAuthStore()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    const data = await getAnnouncements({ role, userId: user?.id })
    setAnnouncements(data)
    setLoading(false)
  }

  const createAnnouncement = async (payload) => {
    await saveAnnouncement({ role, payload })
    refresh()
  }

  const removeAnnouncement = async (id) => {
    await deleteAnnouncement({ role, userId: user?.id, id })
    refresh()
  }

  useEffect(() => {
    if (user) refresh()
  }, [user])

  return {
    announcements,
    loading,
    refresh,
    createAnnouncement,
    removeAnnouncement
  }
}
