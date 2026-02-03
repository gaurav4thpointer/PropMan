import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from './Layout'
import Landing from '../pages/Landing'

export default function HomeOrApp() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

  if (!user) {
    if (!isHome) {
      return <Navigate to="/" replace />
    }
    return <Landing />
  }

  return <Layout />
}
