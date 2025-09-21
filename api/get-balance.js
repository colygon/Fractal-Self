/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Get the virtual currency balance for a user from RevenueCat
 * This uses the server-side API to fetch the current balance
 */
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const app_user_id = req.method === 'POST'
    ? req.body.app_user_id
    : req.query.app_user_id

  if (!app_user_id) {
    return res.status(400).json({
      error: 'Missing required field: app_user_id'
    })
  }

  try {
    const projectId = process.env.REVENUECAT_PROJECT_ID
    const secretKey = process.env.REVENUECAT_API_KEY

    if (!projectId || !secretKey) {
      console.error('Missing RevenueCat configuration')
      return res.status(500).json({
        error: 'Server configuration error'
      })
    }

    // Fetch virtual currency balance from RevenueCat API
    const response = await fetch(
      `https://api.revenuecat.com/v2/projects/${projectId}/subscribers/${encodeURIComponent(app_user_id)}/virtual_currencies`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        }
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error('RevenueCat API error:', result)
      return res.status(response.status).json({
        error: result.message || 'Failed to fetch balance'
      })
    }

    console.log(`✅ Fetched virtual currency balance for user ${app_user_id}:`, result)

    // Return the balance
    const bananaBalance = result.virtual_currencies?.bananas?.balance || 0

    res.status(200).json({
      success: true,
      balance: bananaBalance,
      currencies: result.virtual_currencies
    })

  } catch (error) {
    console.error('Balance API error:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
}