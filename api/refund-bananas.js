/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Refund bananas to a user's RevenueCat virtual currency balance
 * This is used when photo generation fails or other errors occur
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { app_user_id, amount, reason = 'Refund' } = req.body

  if (!app_user_id || !amount || amount <= 0) {
    return res.status(400).json({
      error: 'Missing required fields: app_user_id, amount'
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

    // Add bananas (positive amount for refund) via RevenueCat API
    const response = await fetch(
      `https://api.revenuecat.com/v2/projects/${projectId}/subscribers/${encodeURIComponent(app_user_id)}/virtual_currencies`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adjustments: {
            bananas: amount // Positive amount to add bananas
          },
          idempotency_key: `refund_${app_user_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error('RevenueCat API error:', result)
      return res.status(response.status).json({
        error: result.message || 'Failed to refund bananas'
      })
    }

    console.log(`✅ Refunded ${amount} bananas to user ${app_user_id} for: ${reason}`)

    // Return the new balance
    const newBalance = result.virtual_currencies?.bananas?.balance || 0

    res.status(200).json({
      success: true,
      newBalance,
      refunded: amount,
      reason
    })

  } catch (error) {
    console.error('Refund API error:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
}