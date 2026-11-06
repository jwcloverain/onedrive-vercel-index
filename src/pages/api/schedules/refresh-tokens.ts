import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getLastOdAuthTokenRefresh,
  markOdAuthTokensRefreshed,
} from '../../../utils/odAuthTokenStore'
import { refreshOdAuthTokens } from '../index'

const refreshIntervalMs = 5 * 24 * 60 * 60 * 1000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end()
    return
  }

  try {
    const now = Date.now()
    const lastRefresh = await getLastOdAuthTokenRefresh()
    if (lastRefresh !== null && now - lastRefresh < refreshIntervalMs) {
      res.status(200).json({ refreshed: false })
      return
    }

    const refreshed = await refreshOdAuthTokens()
    if (!refreshed) {
      res.status(200).json({ refreshed: false, reason: 'No refresh token is stored.' })
      return
    }

    await markOdAuthTokensRefreshed(now)
    res.status(200).json({ refreshed: true })
  } catch (error: any) {
    console.error('Scheduled token refresh failed', error?.response?.data ?? error)
    res.status(502).json({ refreshed: false, error: 'Token refresh failed.' })
  }
}
