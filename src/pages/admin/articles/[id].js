import { requireAdminSession } from '../../../lib/admin/session'

export default function EditArticlePage() {
  return null
}

export async function getServerSideProps({ req, params }) {
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
      destination: `/admin?id=${params.id}`,
      permanent: false
    }
  }
}
