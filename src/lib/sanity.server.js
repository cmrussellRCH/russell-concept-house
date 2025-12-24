import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'cc0sr5iy'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || ''

export const writeClient = token
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      token,
      useCdn: false
    })
  : null

export function requireWriteClient() {
  if (!writeClient) {
    throw new Error('SANITY_WRITE_TOKEN must be set for admin mutations.')
  }
  return writeClient
}
