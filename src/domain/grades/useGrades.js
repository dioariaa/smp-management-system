import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { getGrades, saveGrade } from './gradeService'

export const useGrades = () => {
  const { role, user } = useAuthStore()
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    const data = await getGrades({ role, userId: user?.id })
    setGrades(data)
    setLoading(false)
  }

  const update = async (payload) => {
    await saveGrade({ role, payload })
    refresh()
  }

  useEffect(() => {
    if (user) refresh()
  }, [user])

  return {
    grades,
    refresh,
    update,
    loading
  }
}
