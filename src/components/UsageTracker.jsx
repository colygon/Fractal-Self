/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react'
import { useUser } from '@clerk/clerk-react'
import { getUsageDisplay, canTakePhoto, getRemainingCents } from '../lib/billing'
import useStore from '../lib/store'

export default function UsageTracker({ onUpgradeClick }) {
  const { user } = useUser()
  const photos = useStore.use.photos()
  
  // Count this month's cents used (1 cent per photo)
  const now = new Date()
  const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
  
  const monthlyCentsUsed = photos.filter(photo => {
    // Handle photos without timestamps (legacy photos) - consider them as not from this month
    if (!photo.timestamp) return false
    const photoDate = new Date(photo.timestamp)
    const photoMonth = photoDate.getFullYear() + '-' + String(photoDate.getMonth() + 1).padStart(2, '0')
    return photoMonth === thisMonth
  }).length

  // Get subscription from user metadata
  const subscription = user?.publicMetadata?.subscription

  // Debug logging
  console.log('UsageTracker:', { 
    totalPhotos: photos.length, 
    monthlyCentsUsed, 
    thisMonth,
    subscription: subscription?.planId || 'free',
    photosWithTimestamp: photos.filter(p => p.timestamp).length 
  })

  const remaining = getRemainingCents(subscription, monthlyCentsUsed)
  const canTake = canTakePhoto(subscription, monthlyCentsUsed)
  const isFreePlan = !subscription || subscription.status !== 'active'

  return (
    <div className="flex items-center justify-center">
      {isFreePlan && (
        <button
          onClick={onUpgradeClick}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            canTake 
              ? "bg-blue-500 hover:bg-blue-600 text-white" 
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {remaining === 0 ? "0 cents left - Upgrade" : `${remaining} cents left`}
        </button>
      )}
      
      {subscription && subscription.status === 'active' && (
        <div className="bg-green-100 px-4 py-2 rounded-lg">
          <span className="text-green-700 font-medium flex items-center text-sm">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {subscription.planId === 'starter' ? `${remaining} cents left (Starter)` :
             subscription.planId === 'premium' ? `${remaining} cents left (Premium)` : 
             subscription.planId === 'gold' ? `${remaining} cents left (Gold)` : 'Unlimited cents'}
          </span>
        </div>
      )}
    </div>
  )
}