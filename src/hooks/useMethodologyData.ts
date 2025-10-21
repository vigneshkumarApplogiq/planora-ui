import { useState, useEffect } from 'react'
import { projectApiService } from '../services/projectApi'

export type MethodologyType = 'scrum' | 'kanban' | 'waterfall'

export const useMethodologyData = (projectId: string, methodology: MethodologyType) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMethodologyData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await projectApiService.getMethodologyData(projectId, methodology.toLowerCase())

        if (response.success && response.data) {
          setData(response.data)
        } else {
          setError('Failed to fetch methodology data')
          setData(null)
        }
      } catch (err) {
        console.error('API call failed:', err)
        setError('Failed to fetch methodology data')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    if (projectId && methodology) {
      fetchMethodologyData()
    }
  }, [projectId, methodology])

  return { data, loading, error }
}

export const useTimeTracking = (projectId: string, userId?: string) => {
  const [summary, setSummary] = useState<any>(null)
  const [todaysEntries, setTodaysEntries] = useState<any[]>([])
  const [allEntries, setAllEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTimeTrackingData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Try to fetch from API first
        const [summaryResponse, entriesResponse] = await Promise.all([
          projectApiService.getTimeTrackingSummary({ projectId, userId }),
          projectApiService.getTimeEntries({ projectId, userId, limit: 50 })
        ])

        if (summaryResponse.success && summaryResponse.data) {
          setSummary(summaryResponse.data)
        }

        if (entriesResponse.success && entriesResponse.data) {
          setAllEntries(entriesResponse.data)
          const today = new Date().toISOString().split('T')[0]
          setTodaysEntries(entriesResponse.data.filter((entry: any) => entry.date === today))
        }
      } catch (err) {
        console.error('Time tracking API call failed:', err)
        setError('Failed to fetch time tracking data')
        setSummary(null)
        setAllEntries([])
        setTodaysEntries([])
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchTimeTrackingData()
    }
  }, [projectId, userId])

  const startTimer = async (taskId: string, description: string) => {
    try {
      const response = await projectApiService.startTimer({ taskId, projectId, description })
      return response
    } catch (error) {
      console.error('Failed to start timer:', error)
      return { success: false }
    }
  }

  const stopTimer = async (timeEntryId: string) => {
    try {
      const response = await projectApiService.stopTimer(timeEntryId)
      return response
    } catch (error) {
      console.error('Failed to stop timer:', error)
      return { success: false }
    }
  }

  const addTimeEntry = async (entry: any) => {
    try {
      const response = await projectApiService.addTimeEntry(entry)
      if (response.success) {
        // Refresh data
        setAllEntries(prev => [response.data, ...prev])
        if (entry.date === new Date().toISOString().split('T')[0]) {
          setTodaysEntries(prev => [response.data, ...prev])
        }
      }
      return response
    } catch (error) {
      console.error('Failed to add time entry:', error)
      return { success: false }
    }
  }

  return {
    summary,
    todaysEntries,
    allEntries,
    loading,
    error,
    startTimer,
    stopTimer,
    addTimeEntry
  }
}