import { useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/admin/AdminLayout'
import { requireAdminSession } from '../../lib/admin/session'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Unable to sign in.')
      }

      router.push('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout
      title="Sign In"
      subtitle="Use your admin email and access code to manage articles."
    >
      <form className="admin-card admin-grid" onSubmit={handleSubmit}>
        <div className="admin-field">
          <label className="admin-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="admin-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="code">Access Code</label>
          <input
            id="code"
            className="admin-input"
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
        </div>
        {error && <p className="admin-note" style={{ color: '#b42318' }}>{error}</p>}
        <button className="admin-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </AdminLayout>
  )
}

export async function getServerSideProps({ req }) {
  const session = requireAdminSession(req)
  if (session) {
    return {
      redirect: {
        destination: '/admin',
        permanent: false
      }
    }
  }

  return { props: {} }
}
