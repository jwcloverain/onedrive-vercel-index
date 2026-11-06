import Redis from 'ioredis'
import siteConfig from '../../config/site.config'

// Persistent key-value store is provided by Redis, hosted on Upstash
// https://vercel.com/integrations/upstash
const kv = new Redis(process.env.REDIS_URL || '')

export async function getOdAuthTokens(): Promise<{ accessToken: unknown; refreshToken: unknown }> {
  const accessToken = await kv.get(`${siteConfig.kvPrefix}access_token`)
  const refreshToken = await kv.get(`${siteConfig.kvPrefix}refresh_token`)

  return {
    accessToken,
    refreshToken,
  }
}

export async function storeOdAuthTokens({
  accessToken,
  accessTokenExpiry,
  refreshToken,
}: {
  accessToken: string
  accessTokenExpiry: number
  refreshToken: string
}): Promise<void> {
  await kv.set(`${siteConfig.kvPrefix}access_token`, accessToken, 'EX', accessTokenExpiry)
  await kv.set(`${siteConfig.kvPrefix}refresh_token`, refreshToken)
}

export async function getLastOdAuthTokenRefresh(): Promise<number | null> {
  const refreshedAt = await kv.get(`${siteConfig.kvPrefix}tokens_refreshed_at`)
  if (!refreshedAt) return null

  const timestamp = Number(refreshedAt)
  return Number.isFinite(timestamp) ? timestamp : null
}

export async function markOdAuthTokensRefreshed(timestamp: number): Promise<void> {
  await kv.set(`${siteConfig.kvPrefix}tokens_refreshed_at`, String(timestamp))
}
