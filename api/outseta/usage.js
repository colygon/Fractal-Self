/**
 * Outseta Usage Tracking API
 * Tracks photo generation usage for metered billing
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userEmail, amount = 1 } = req.body

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' })
    }

    // You'll need to set these in your environment
    const OUTSETA_API_KEY = process.env.OUTSETA_API_KEY
    const OUTSETA_DOMAIN = 'bananacam.outseta.com'
    const PHOTO_ADDON_UID = process.env.OUTSETA_PHOTO_ADDON_UID // You'll get this from Outseta dashboard

    if (!OUTSETA_API_KEY || !PHOTO_ADDON_UID) {
      console.error('Missing Outseta configuration')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Step 1: Find the account by email
    const accountResponse = await fetch(`https://${OUTSETA_DOMAIN}/api/v1/crm/people?emailAddress=${encodeURIComponent(userEmail)}`, {
      headers: {
        'Authorization': `Outseta ${OUTSETA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!accountResponse.ok) {
      throw new Error(`Failed to fetch account: ${accountResponse.status}`)
    }

    const people = await accountResponse.json()
    if (!people.items || people.items.length === 0) {
      return res.status(404).json({ error: 'User account not found' })
    }

    const person = people.items[0]
    const accountUid = person.Account?.Uid

    if (!accountUid) {
      return res.status(404).json({ error: 'User account not found' })
    }

    // Step 2: Get account with subscription details
    const accountDetailResponse = await fetch(`https://${OUTSETA_DOMAIN}/api/v1/crm/accounts/${accountUid}`, {
      headers: {
        'Authorization': `Outseta ${OUTSETA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!accountDetailResponse.ok) {
      throw new Error(`Failed to fetch account details: ${accountDetailResponse.status}`)
    }

    const account = await accountDetailResponse.json()

    // Step 3: Find the correct subscription add-on
    let subscriptionAddOnUid = null
    
    if (account.Subscriptions) {
      for (const subscription of account.Subscriptions) {
        if (subscription.SubscriptionAddOns) {
          for (const addOn of subscription.SubscriptionAddOns) {
            if (addOn.AddOn?.Uid === PHOTO_ADDON_UID) {
              subscriptionAddOnUid = addOn.Uid
              break
            }
          }
        }
        if (subscriptionAddOnUid) break
      }
    }

    if (!subscriptionAddOnUid) {
      return res.status(404).json({ error: 'Photo credits subscription not found' })
    }

    // Step 4: Submit usage data
    const usageData = {
      UsageDate: new Date().toISOString(),
      Amount: amount,
      SubscriptionAddOn: {
        Uid: subscriptionAddOnUid
      }
    }

    const usageResponse = await fetch(`https://${OUTSETA_DOMAIN}/api/v1/billing/usage`, {
      method: 'POST',
      headers: {
        'Authorization': `Outseta ${OUTSETA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(usageData)
    })

    if (!usageResponse.ok) {
      const errorText = await usageResponse.text()
      console.error('Usage tracking failed:', errorText)
      throw new Error(`Failed to track usage: ${usageResponse.status}`)
    }

    const result = await usageResponse.json()
    
    console.log(`📊 Tracked ${amount} photo(s) for ${userEmail}`)
    
    return res.status(200).json({
      success: true,
      message: `Tracked ${amount} photo(s)`,
      usage: result
    })

  } catch (error) {
    console.error('Usage tracking error:', error)
    return res.status(500).json({ 
      error: 'Failed to track usage',
      details: error.message 
    })
  }
}