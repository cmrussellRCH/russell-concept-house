import { requireAdminSession } from '../../../lib/admin/session'

export default function NewArticlePage() {
  return null
}

export async function getServerSideProps({ req }) {
  const session = requireAdminSession(req)
  if (!session) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false
      }
    }
  }

  return {
    redirect: {
      destination: '/admin?new=1',
      permanent: false
    }
  }
}
