/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useRef, useState, useCallback, useEffect} from 'react'
import c from 'clsx'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
  useClerk,
} from '@clerk/clerk-react'
import PricingPage from './PricingPage.jsx'
import BillingDashboard from './BillingDashboard.jsx'
import {
  snapPhoto,
  setMode,
  deletePhoto,
  cancelPhotoGeneration,
  makeGif,
  hideGif,
  setCustomPrompt,
  setLiveMode,
  setReplayMode,
  clearAllPhotos,
  toggleFavorite,
  togglePhotoSelection,
  selectAllPhotos,
  init,
  setCameraMode,
  downloadPhoto,
  clearLastError
} from '../lib/actions'
import useStore from '../lib/store'
import imageData from '../lib/imageData'
import modes from '../lib/modes'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
const modeKeys = Object.keys(modes)

// Custom useCustomer implementation since autumn-js is broken
function useCustomer() {
  const [customer, setCustomer] = useState(null)
  
  const openCheckout = async ({ product_id, success_url, cancel_url }) => {
    try {
      // Call our custom Autumn API backend (production URL)
      const apiBase = import.meta.env.PROD ? '' : 'https://fractal-self-47cj87862-dablclub.vercel.app'
      
      // Get auth token if available, but don't fail if Clerk isn't ready
      let authToken = ''
      try {
        if (window.Clerk?.session) {
          authToken = await window.Clerk.session.getToken()
        }
      } catch (authError) {
        console.warn('Could not get Clerk token:', authError)
      }
      
      const response = await fetch(`${apiBase}/api/autumn/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ product_id, success_url, cancel_url })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Checkout API error:', response.status, errorText)
        throw new Error(`Checkout failed: ${response.status}`)
      }
      
      const checkout = await response.json()
      console.log('Checkout response:', checkout)
      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      throw error
    }
  }
  
  // Load customer data on mount
  useEffect(() => {
    async function loadCustomer() {
      try {
        const apiBase = import.meta.env.PROD ? '' : 'https://fractal-self-47cj87862-dablclub.vercel.app'
        
        // Get auth token if available
        let authToken = ''
        try {
          if (window.Clerk?.session) {
            authToken = await window.Clerk.session.getToken()
          }
        } catch (authError) {
          console.warn('Could not get Clerk token for customer load:', authError)
        }
        
        const response = await fetch(`${apiBase}/api/autumn/customers`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        if (response.ok) {
          const customerData = await response.json()
          console.log('Loaded customer data:', customerData)
          setCustomer(customerData)
        } else {
          console.warn('Failed to load customer:', response.status, await response.text())
        }
      } catch (error) {
        console.error('Failed to load customer:', error)
      }
    }
    
    loadCustomer()
  }, [])
  
  return { customer, openCheckout }
}

export default function App() {
  const photos = useStore.use.photos()
  const favorites = useStore.use.favorites()
  const selectedPhotos = useStore.use.selectedPhotos()
  const customPrompt = useStore.use.customPrompt()
  const activeMode = useStore.use.activeMode()
  const gifInProgress = useStore.use.gifInProgress()
  const gifUrl = useStore.use.gifUrl()
  const liveMode = useStore.use.liveMode()
  const replayMode = useStore.use.replayMode()
  const cameraMode = useStore.use.cameraMode()
  const lastError = useStore.use.lastError()

  const [videoActive, setVideoActive] = useState(false)
  const [focusedId, setFocusedId] = useState(null)
  const [hoveredMode, setHoveredMode] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({top: 0, left: 0})
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [stylesVisible, setStylesVisible] = useState(true)
  const [galleryVisible, setGalleryVisible] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [autoCapture, setAutoCapture] = useState(false)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [replayImageIndex, setReplayImageIndex] = useState(0)
  const [showFlash, setShowFlash] = useState(false)
  const [showBilling, setShowBilling] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const { customer, openCheckout } = useCustomer()
  
  // Debug logging
  console.log('useCustomer hook data:', { customer, openCheckout: !!openCheckout })

  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768)
  const [desktopMirror, setDesktopMirror] = useState(true)
  const [facingMode, setFacingMode] = useState('user')

  const videoRef = useRef(null)
  const pipVideoRef = useRef(null)
  const { user } = useUser()
  const { openUserProfile } = useClerk()
  
  // Debug logging
  console.log('User state:', { user: !!user, userId: user?.id })

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth > 768)
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])


  const streamRef = useRef(null)
  const genControllersRef = useRef([])
  const autoCaptureTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)

  const latestFinishedPhoto = photos.find(p => !p.isBusy && imageData.outputs[p.id]?.startsWith('data:image/'))
  const replayPhotos = selectedPhotos.length > 0 
    ? photos.filter(p => {
        const output = imageData.outputs[p.id]
        return !p.isBusy && selectedPhotos.includes(p.id) && output && typeof output === 'string' && output.length > 100 && output.startsWith('data:image/')
      }).slice(0, 10)
    : photos.filter(p => {
        const output = imageData.outputs[p.id]
        return !p.isBusy && output && typeof output === 'string' && output.length > 100 && output.startsWith('data:image/')
      }).slice(0, 10).reverse()
  const busyPhotos = photos.filter(p => p.isBusy)


  useEffect(() => {
    if (!replayMode || replayPhotos.length === 0) {
      return
    }
    const intervalId = setInterval(() => {
      setReplayImageIndex(prevIndex => (prevIndex + 1) % replayPhotos.length)
    }, 1500)
    return () => clearInterval(intervalId)
  }, [replayMode, replayPhotos.length])

  const stopVideo = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject = null
    }
    setVideoActive(false)
  }, [])

  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {width: {ideal: 1920}, height: {ideal: 1080}, facingMode: {ideal: facingMode}},
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setVideoActive(true)
        }
      }
      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = stream
        pipVideoRef.current.onloadedmetadata = () => {
          pipVideoRef.current.play()
        }
      }
    } catch (err) {
      console.error('Error accessing webcam:', err)
    }
  }, [facingMode])

  useEffect(() => {
    startVideo()
    return () => {
      stopVideo()
    }
  }, [startVideo, stopVideo, facingMode])

  const isMirrored = isDesktop ? desktopMirror : facingMode === 'user';
  const videoTransform = { transform: isMirrored ? 'rotateY(180deg)' : 'none' };

  const takePhoto = useCallback(async (signal, showFlashEffect = true) => {
    try {
      const video = videoRef.current
      if (!video || video.readyState < 2) {
        console.warn('Video not ready for capture', { 
          hasVideo: !!video, 
          readyState: video?.readyState,
          videoActive 
        })
        return
      }

      // Trigger flash effect only if requested
      if (showFlashEffect) {
        setShowFlash(true)
        setTimeout(() => setShowFlash(false), 300)
      }

      const {videoWidth, videoHeight} = video
      if (videoWidth === 0 || videoHeight === 0) {
        console.warn('Video has zero dimensions', { videoWidth, videoHeight })
        return
      }

      canvas.width = videoWidth
      canvas.height = videoHeight

      ctx.clearRect(0, 0, videoWidth, videoHeight)
      // Do not flip the image being sent to the API if it's mirrored
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight)

      const dataURL = canvas.toDataURL('image/jpeg')
      if (dataURL.length < 1000) {
        console.error('Generated image data too small', { length: dataURL.length })
        return
      }

      console.log('Capturing photo', { videoWidth, videoHeight, dataLength: dataURL.length })
      
      // Check if user has sufficient credits or free photos remaining
      const creditsRemaining = customer?.usage?.credits || 0
      const freePhotosUsed = parseInt(localStorage.getItem('freePhotosUsed') || '0')
      const freePhotosLimit = 10
      
      // If user has credits, use them
      if (creditsRemaining >= 5) {
        // User has credits, proceed normally
      } 
      // If no credits but still have free photos available
      else if (freePhotosUsed < freePhotosLimit) {
        // User can use free photos, will increment counter after successful generation
        console.log(`Using free photo ${freePhotosUsed + 1} of ${freePhotosLimit}`)
      } 
      // No credits and no free photos left
      else {
        console.warn('No credits or free photos remaining')
        setShowPricing(true) // Show pricing page to upgrade
        return
      }
      
      // Take the photo (credit tracking will be handled by Autumn backend)
      try {
        await snapPhoto(dataURL, signal, user)
        console.log('✅ Photo generated successfully')
        
        // Increment free photo counter if user is using free photos
        if (creditsRemaining < 5 && freePhotosUsed < freePhotosLimit) {
          const newFreePhotosUsed = freePhotosUsed + 1
          localStorage.setItem('freePhotosUsed', newFreePhotosUsed.toString())
          console.log(`Free photos used: ${newFreePhotosUsed}/${freePhotosLimit}`)
        }
      } catch (error) {
        console.error('Photo generation failed', error)
        throw error
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Failed to take photo', e)
      }
    }
  }, [videoActive])

  const stopTimers = useCallback(() => {
    clearTimeout(autoCaptureTimerRef.current)
    clearTimeout(countdownTimerRef.current)
    clearInterval(countdownTimerRef.current) // Clear both timeout and interval
    setCountdown(null)
    setIsCountingDown(false)
    genControllersRef.current.forEach(controller => controller.abort())
    genControllersRef.current = []
    setAutoCapture(false)
    setLiveMode(false)
  }, [])
  
  // Auto-capture logic
  useEffect(() => {
    if (!autoCapture || !videoActive) {
      stopTimers();
      return;
    }

    const performCapture = () => {
      const controller = new AbortController();
      genControllersRef.current.push(controller);
      takePhoto(controller.signal, !liveMode).finally(() => {
        genControllersRef.current = genControllersRef.current.filter(c => c !== controller);
      });
    };

    if (cameraMode === 'STREAM') {
      const continuousCapture = () => {
        performCapture();
        autoCaptureTimerRef.current = setTimeout(continuousCapture, 5000); // 5-second interval
      };
      continuousCapture();
    }
    
    return stopTimers;
  }, [autoCapture, videoActive, cameraMode, liveMode, takePhoto, stopTimers]);


  // Initialize the app and load saved photos
  useEffect(() => {
    init()
  }, [])

  // Add keyboard shortcuts for focused photo mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (focusedId && !gifUrl) {
        switch (event.key) {
          case 'Escape':
            event.preventDefault()
            setFocusedId(null)
            break
          case 'f':
            event.preventDefault()
            toggleFavorite(focusedId)
            break
          case 'd':
          case 'Backspace':
          case 'Delete':
            event.preventDefault()
            deletePhoto(focusedId)
            setFocusedId(null)
            break
          case 'ArrowLeft':
            event.preventDefault()
            const finishedPhotosLeft = photos.filter(p => !p.isBusy)
            const currentIndexLeft = finishedPhotosLeft.findIndex(p => p.id === focusedId)
            if (currentIndexLeft > 0) {
              setFocusedId(finishedPhotosLeft[currentIndexLeft - 1].id)
            }
            break
          case 'ArrowRight':
            event.preventDefault()
            const finishedPhotosRight = photos.filter(p => !p.isBusy)
            const currentIndexRight = finishedPhotosRight.findIndex(p => p.id === focusedId)
            if (currentIndexRight < finishedPhotosRight.length - 1) {
              setFocusedId(finishedPhotosRight[currentIndexRight + 1].id)
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [focusedId, gifUrl])

  useEffect(() => {
    // Manage gallery visibility based on device
    if (!isDesktop) {
      // Always hide main gallery on mobile
      setGalleryVisible(false);
    }
  }, [isDesktop]);

  
  const handlePhotoButtonClick = () => {
    // If we're already auto-capturing, this button acts as a stop button
    if (autoCapture) {
      stopTimers()
      return
    }

    if (cameraMode === 'TIMER') {
      // Stop any existing timers first
      clearTimeout(countdownTimerRef.current)
      clearInterval(countdownTimerRef.current)
      setIsCountingDown(true)
      setCountdown(5)

      console.log('Starting timer countdown from 5')

      // Use a simpler approach with direct countdown state management
      let currentCount = 5
      const timerInterval = setInterval(() => {
        currentCount--
        console.log('Timer tick:', currentCount)
        if (currentCount > 0) {
          setCountdown(currentCount)
        } else {
          console.log('Timer finished, taking photo')
          clearInterval(timerInterval)
          setCountdown(null)
          setIsCountingDown(false)
          takePhoto(null)
        }
      }, 1000)
      
      // Store the interval ID so we can clear it if needed
      countdownTimerRef.current = timerInterval
    } else if (cameraMode === 'STREAM') {
      setAutoCapture(true)
      setLiveMode(true)
    } else {
      // Normal photo
      takePhoto(null)
    }
  }

  const focusedPhoto = focusedId ? photos.find(p => p.id === focusedId) : null
  const hideControls = liveMode && cameraMode === 'STREAM'

  const memoizedHandleModeClick = useCallback((mode) => {
    setMode(mode);
    if (!isDesktop) {
      setStylesVisible(false);
    }
  }, [isDesktop]);

  return (
    <main
      className={c({
        galleryHidden: !galleryVisible,
        stylesHidden: !stylesVisible,
        liveMode: liveMode
      })}
    >
      <header style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 9999 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Credits/Balance button - always visible */}
          <button
            onClick={() => {
              // Show dashboard for existing customers, pricing for new/free users
              const currentPlan = customer?.subscription?.product_id
              if (currentPlan && currentPlan !== 'free') {
                setShowBilling(true)
              } else {
                setShowPricing(true)
              }
            }}
            style={(() => {
              const credits = customer?.usage?.credits || 0
              const freePhotosUsed = parseInt(localStorage.getItem('freePhotosUsed') || '0')
              const freePhotosLimit = 10
              const freePhotosRemaining = Math.max(0, freePhotosLimit - freePhotosUsed)
              const needsUpgrade = credits === 0 && freePhotosRemaining === 0
              const isRectangular = needsUpgrade || freePhotosRemaining > 0
              
              return {
                background: needsUpgrade
                  ? 'linear-gradient(135deg, #8B5CF6, #EC4899)'
                  : freePhotosRemaining > 0
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: isRectangular ? '8px' : '50%',
                width: isRectangular ? 'auto' : '50px',
                height: isRectangular ? 'auto' : '50px',
                padding: isRectangular ? '8px 16px' : '0',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '10px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
              }
            })()}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            {(() => {
              const credits = customer?.usage?.credits || 0
              const freePhotosUsed = parseInt(localStorage.getItem('freePhotosUsed') || '0')
              const freePhotosLimit = 10
              const freePhotosRemaining = Math.max(0, freePhotosLimit - freePhotosUsed)
              
              if (credits > 0) {
                return <span>{credits + '💎'}</span>
              } else if (freePhotosRemaining > 0) {
                return <span style={{ fontSize: '10px', fontWeight: '600' }}>
                  {freePhotosRemaining} FREE
                </span>
              } else {
                return <span style={{ fontSize: '11px', fontWeight: '600' }}>Upgrade</span>
              }
            })()}
          </button>

          <SignedOut>
            <SignInButton mode="modal">
              <button style={{
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                minWidth: '80px'
              }}>
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            {(() => {
              console.log('Inside SignedIn component')
              // Get user's current credits from Autumn customer data
              const creditsRemaining = customer?.usage?.credits || 0

              return (
                <button
                  onClick={() => {
                    // Show dashboard for existing customers, pricing for new/free users
                    const currentPlan = customer?.subscription?.product_id
                    if (currentPlan && currentPlan !== 'free') {
                      setShowBilling(true)
                    } else {
                      setShowPricing(true)
                    }
                  }}
                  style={{
                    background: creditsRemaining === 0 
                      ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' 
                      : 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                  }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                >
                  {creditsRemaining === 0 ? (
                    <span>⚡</span>
                  ) : (
                    <span>{creditsRemaining + '💎'}</span>
                  )}
                </button>
              )
            })()}
          </SignedIn>
        </div>
      </header>
      {liveMode && (
        <>
          <button className={c('liveButton', {active: autoCapture})}>
            Live
          </button>
          {latestFinishedPhoto && imageData.outputs[latestFinishedPhoto.id] && (
            <div className="streamFullscreenImage">
              <img 
                src={imageData.outputs[latestFinishedPhoto.id]} 
                alt="Latest generated image" 
              />
            </div>
          )}
          <div className="pipWebcam">
            <video
              ref={pipVideoRef}
              playsInline
              autoPlay
              muted
              style={videoTransform}
            />
          </div>
        </>
      )}

      {!hideControls && !gifUrl && photos.length > 0 && !replayMode && focusedId && (
        <div className="topLeftPlayBtn" onClick={() => setReplayMode(true)}>
          <span className="icon">play_arrow</span>
        </div>
      )}

      {replayMode && replayPhotos.length > 0 && (
        <div className="replayView">
          <img src={imageData.outputs[replayPhotos[replayImageIndex].id]} />
          <div
            className="topLeftPlayBtn"
            onClick={() => setReplayMode(false)}
          >
            <span className="icon">stop</span>
          </div>
        </div>
      )}

      <div className="video">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          style={videoTransform}
        />
        <div className={c('flash', {active: showFlash})} />

        {countdown && <div key={countdown} className="countdown">{countdown}</div>}

        {!hideControls && !focusedId && <Results
          photos={photos}
          favorites={favorites}
          selectedPhotos={selectedPhotos}
          focusedId={focusedId}
          setFocusedId={setFocusedId}
          busyPhotos={busyPhotos}
        />}

        {focusedId && (
          <FocusedPhoto
            photo={focusedPhoto}
            onClose={() => setFocusedId(null)}
            isFavorite={favorites.includes(focusedId)}
            onMakeGif={makeGif}
            isDesktop={isDesktop}
            onPrevious={() => {
              const finishedPhotos = photos.filter(p => !p.isBusy)
              const currentIndex = finishedPhotos.findIndex(p => p.id === focusedId)
              if (currentIndex > 0) {
                setFocusedId(finishedPhotos[currentIndex - 1].id)
              }
            }}
            onNext={() => {
              const finishedPhotos = photos.filter(p => !p.isBusy)
              const currentIndex = finishedPhotos.findIndex(p => p.id === focusedId)
              if (currentIndex < finishedPhotos.length - 1) {
                setFocusedId(finishedPhotos[currentIndex + 1].id)
              }
            }}
          >
            <Results
              photos={photos}
              favorites={favorites}
              selectedPhotos={selectedPhotos}
              focusedId={focusedId}
              setFocusedId={setFocusedId}
              busyPhotos={busyPhotos}
            />
          </FocusedPhoto>
        )}

        {gifUrl && (
          <div className="liveGifView">
            <img src={gifUrl} />
            <button
              className="circleBtn"
              style={{
                top: '20px',
                left: '20px',
                zIndex: 10
              }}
              onClick={hideGif}
            >
              <span className="icon">close</span>
            </button>
            <button
              className="circleBtn"
              style={{
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-100px)',
                zIndex: 10
              }}
              onClick={async () => {
                try {
                  const response = await fetch(gifUrl)
                  const blob = await response.blob()
                  const file = new File([blob], 'banana-cam.gif', {type: 'image/gif'})
                  
                  if (navigator.canShare && navigator.canShare({files: [file]})) {
                    await navigator.share({
                      files: [file],
                      title: 'Banana Cam GIF',
                      text: 'Check out this GIF I made with Banana Cam! Visit www.banana.cam to make your own.'
                    })
                  } else {
                    alert("Sharing not supported on this browser.")
                  }
                } catch (error) {
                  console.error('Error sharing GIF:', error)
                  // Silently fail - sharing is optional functionality
                }
              }}
            >
              <span className="icon">ios_share</span>
            </button>
            <button
              className="circleBtn"
              style={{
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-28px)',
                zIndex: 10
              }}
              onClick={() => {
                const link = document.createElement('a')
                link.href = gifUrl
                link.download = 'banana-cam.gif'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
            >
              <span className="icon">download</span>
            </button>
          </div>
        )}
      </div>

      {showCustomPrompt && (
        <div className="customPrompt">
          <div className="customPromptContent">
            <h3>Custom Prompt</h3>
            <textarea
              defaultValue={customPrompt}
              placeholder="Describe your desired transformation..."
            />
            <button
              className="saveButton"
              onClick={e => {
                const newPrompt = e.currentTarget.previousSibling.value
                setCustomPrompt(newPrompt)
                setShowCustomPrompt(false)
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
      
      <IphoneCameraControls
        isStreaming={hideControls}
        latestFinishedPhoto={latestFinishedPhoto}
        photos={photos}
        galleryVisible={galleryVisible}
        setGalleryVisible={setGalleryVisible}
        activeMode={activeMode}
        onModeClick={memoizedHandleModeClick}
        onShutterClick={handlePhotoButtonClick}
        autoCapture={autoCapture}
        isCountingDown={isCountingDown}
        isDesktop={isDesktop}
        cameraMode={cameraMode}
        hideControls={hideControls}
        setCameraMode={setCameraMode}
        facingMode={facingMode}
        setFacingMode={setFacingMode}
        desktopMirror={desktopMirror}
        setDesktopMirror={setDesktopMirror}
        stopTimers={stopTimers}
        stylesVisible={stylesVisible}
        setStylesVisible={setStylesVisible}
        busyPhotos={busyPhotos}
        setFocusedId={setFocusedId}
        setShowCustomPrompt={setShowCustomPrompt}
        customPrompt={customPrompt}
      />

      
      {lastError && (
        <ErrorToast 
          error={lastError} 
          onClose={clearLastError} 
        />
      )}


      {showBilling && (
        <BillingDashboard 
          onBack={() => setShowBilling(false)} 
          onUpgrade={() => {
            setShowBilling(false)
            setShowPricing(true)
          }}
        />
      )}
      
      {showPricing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <button 
                onClick={() => setShowPricing(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              
              <h1 style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                Choose Your Plan
              </h1>
              <p style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Transform your photos with AI. All plans include overage billing at $0.05 per photo.
              </p>
            </div>

            {/* Pricing Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              maxWidth: '1400px',
              margin: '0 auto'
            }}>
              {/* Starter Plan */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                color: 'white'
              }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', marginBottom: '8px' }}>Starter</h3>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                  $3.99
                </div>
                <p style={{ marginBottom: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>400 photo credits</p>
                <button 
                  onClick={async () => {
                    try {
                      if (openCheckout) {
                        await openCheckout({
                          product_id: 'credits-50',
                          success_url: window.location.origin + '?checkout=success',
                          cancel_url: window.location.origin + '?checkout=canceled'
                        })
                      } else {
                        alert('The checkout system is undergoing maintenance. Please try again later.')
                      }
                    } catch (error) {
                      console.error('Checkout error:', error)
                      alert('Error starting checkout. Please try again.')
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  Get Starter
                </button>
              </div>

              {/* Premium Plan */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid #8B5CF6',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                color: 'white',
                transform: 'scale(1.05)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#8B5CF6',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  POPULAR
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#8B5CF6', marginBottom: '8px' }}>Premium</h3>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                  $19.99
                </div>
                <p style={{ marginBottom: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>2,000 photo credits</p>
                <button 
                  onClick={async () => {
                    try {
                      if (openCheckout) {
                        await openCheckout({
                          product_id: 'credits-200',
                          success_url: window.location.origin + '?checkout=success',
                          cancel_url: window.location.origin + '?checkout=canceled'
                        })
                      } else {
                        alert('The checkout system is undergoing maintenance. Please try again later.')
                      }
                    } catch (error) {
                      console.error('Checkout error:', error)
                      alert('Error starting checkout. Please try again.')
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: '#8B5CF6',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.target.style.opacity = '0.9'}
                  onMouseLeave={e => e.target.style.opacity = '1'}
                >
                  Get Premium
                </button>
              </div>

              {/* Gold Plan */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                color: 'white'
              }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B', marginBottom: '8px' }}>Gold</h3>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                  $49.99
                </div>
                <p style={{ marginBottom: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>5,000 photo credits</p>
                <button 
                  onClick={async () => {
                    try {
                      if (openCheckout) {
                        await openCheckout({
                          product_id: 'credits-500',
                          success_url: window.location.origin + '?checkout=success',
                          cancel_url: window.location.origin + '?checkout=canceled'
                        })
                      } else {
                        alert('The checkout system is undergoing maintenance. Please try again later.')
                      }
                    } catch (error) {
                      console.error('Checkout error:', error)
                      alert('Error starting checkout. Please try again.')
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  Get Gold
                </button>
              </div>

              {/* Diamond Plan */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                color: 'white'
              }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#EC4899', marginBottom: '8px' }}>Diamond</h3>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                  $499.99
                </div>
                <p style={{ marginBottom: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>50,000 photo credits</p>
                <button 
                  onClick={async () => {
                    try {
                      if (openCheckout) {
                        await openCheckout({
                          product_id: 'credits-1000',
                          success_url: window.location.origin + '?checkout=success',
                          cancel_url: window.location.origin + '?checkout=canceled'
                        })
                      } else {
                        alert('The checkout system is undergoing maintenance. Please try again later.')
                      }
                    } catch (error) {
                      console.error('Checkout error:', error)
                      alert('Error starting checkout. Please try again.')
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  Get Diamond
                </button>
              </div>


              {/* Enterprise Plan */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#00D4AA', marginBottom: '8px' }}>
                  Enterprise
                </h3>
                <p style={{ marginBottom: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Unlimited scale for large organizations
                </p>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Contact Us
                </div>
                <p style={{ marginBottom: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>Custom pricing & unlimited photos</p>
                <button 
                  onClick={() => {
                    window.location.href = 'mailto:enterprise@fractalself.com?subject=Enterprise Plan Inquiry'
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function Results({photos, favorites, selectedPhotos, focusedId, setFocusedId, busyPhotos}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  if (photos.length === 0) {
    return null
  }

  return (
    <div className={c('results', {'has-selection': selectedPhotos.length > 0})}>
      <ul>
        {photos.map(photo => (
          <li
            key={photo.id}
            className={c({
              isBusy: photo.isBusy,
              isSelected: selectedPhotos.includes(photo.id),
            })}
            onClick={e => {
              e.stopPropagation();
              // Clicks on other controls inside the LI are stopped separately.
              // This handler is for the photo itself.
              !photo.isBusy && setFocusedId(photo.id);
            }}
          >
            <div className="photo">
              {photo.isBusy ? (
                <div className="photo-generating">
                  <img
                    className="generating-base-image"
                    src={imageData.inputs[photo.id]}
                    alt="Generating..."
                  />
                  <div className="shimmer-overlay">
                     <span className="queue-number">{busyPhotos.findIndex(p => p.id === photo.id) + 1}</span>
                     <button 
                       className="cancel-generation-btn"
                       onClick={e => {
                         e.stopPropagation();
                         cancelPhotoGeneration(photo.id);
                       }}
                       title="Cancel generation"
                     >
                       <span className="icon">close</span>
                     </button>
                  </div>
                </div>
              ) : (
                imageData.outputs[photo.id] ? (
                  <img src={imageData.outputs[photo.id]} alt="Generated photo" />
                ) : (
                  <div className="photo-placeholder failed">
                    <span className="icon">error</span>
                  </div>
                )
              )}
            </div>

            {!photo.isBusy && (
              <>
                <label className="photoSelector" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedPhotos.includes(photo.id)}
                    onChange={() => togglePhotoSelection(photo.id)}
                  />
                  <span className="checkmark">
                    <span className="selectionNumber">
                      {selectedPhotos.indexOf(photo.id) + 1}
                    </span>
                  </span>
                </label>
                <div className="emoji">{modes[photo.mode]?.emoji}</div>
                <button
                  className={c('favoriteIndicator', {
                    unfavorited: !favorites.includes(photo.id)
                  })}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(photo.id)
                  }}
                >
                  <span className="icon">favorite</span>
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

    </div>
  )
}

function FocusedPhoto({photo, onClose, isFavorite, children, onMakeGif, onPrevious, onNext, isDesktop}) {
  const [touchStart, setTouchStart] = useState(null)
  
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    })
  }
  
  const handleTouchEnd = (e) => {
    if (!touchStart) return
    
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStart.x
    const deltaY = touchEndY - touchStart.y
    const deltaTime = Date.now() - touchStart.time
    
    // Only process swipes that are quick enough
    if (deltaTime < 500) {
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)
      
      // Swipe down detection: vertical distance > 100px and primarily vertical
      if (deltaY > 100 && absDeltaY > absDeltaX) {
        onClose()
      }
      // Swipe left detection: horizontal distance > 100px and primarily horizontal
      else if (deltaX < -100 && absDeltaX > absDeltaY && onNext) {
        onNext()
      }
      // Swipe right detection: horizontal distance > 100px and primarily horizontal  
      else if (deltaX > 100 && absDeltaX > absDeltaY && onPrevious) {
        onPrevious()
      }
    }
    
    setTouchStart(null)
  }

  const sharePhoto = async () => {
    try {
      const response = await fetch(imageData.outputs[photo.id])
      const blob = await response.blob()
      const file = new File([blob], 'photo.jpg', {type: 'image/jpeg'})
      const postcardMessage = modes[photo.mode]?.postcardText || '';
      
      const shareData = {
        files: [file],
        text: `${postcardMessage}\nI took this photo with Banana Cam - visit www.banana.cam to try it yourself!`,
      }
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        alert("Sharing not supported on this browser.")
      }
    } catch (error) {
      console.error('Error sharing photo:', error)
      // Silently fail - sharing is optional functionality
    }
  }

  return (
    <div 
      className="focusedPhoto" 
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button className="focusedCloseBtn" onClick={e => { e.stopPropagation(); onClose(); }}>
        <span className="icon">close</span>
      </button>

      <div className="focusedImageWrapper" onClick={e => e.stopPropagation()}>
        <img src={imageData.outputs[photo.id]} alt="Focused photo" />
      </div>


      {children}

      <div className="focusedPhotoActions">
        <button className="button shareButton" onClick={e => { e.stopPropagation(); sharePhoto(); }}>
          <span className="icon">ios_share</span>
        </button>
        <div className="focusedPhotoActions-center">
          <button 
            className="button" 
            onClick={e => { e.stopPropagation(); downloadPhoto(photo.id); }}
            style={{ display: isDesktop ? 'block' : 'none' }}
          >
            <span className="icon">download</span>
          </button>
          <button className={c('button', {active: isFavorite})} onClick={e => {e.stopPropagation(); toggleFavorite(photo.id)}}>
            <span className="icon">favorite</span>
          </button>
          <button className="button" onClick={e => { e.stopPropagation(); onMakeGif(); }}>
            <span className="icon">gif</span>
          </button>
        </div>
        <button className="button deleteButton" onClick={e => { e.stopPropagation(); deletePhoto(photo.id); onClose(); }}>
          <span className="icon">delete</span>
        </button>
      </div>
    </div>
  )
}

function IphoneCameraControls({
  isStreaming,
  latestFinishedPhoto,
  photos,
  galleryVisible,
  setGalleryVisible,
  activeMode,
  onModeClick,
  onShutterClick,
  autoCapture,
  isCountingDown,
  isDesktop,
  cameraMode,
  setCameraMode,
  facingMode,
  setFacingMode,
  desktopMirror,
  setDesktopMirror,
  stopTimers,
  stylesVisible,
  setStylesVisible,
  busyPhotos,
  setFocusedId,
  setShowCustomPrompt,
  customPrompt,
  hideControls
}) {
  const [hoveredMode, setHoveredMode] = useState(null);
  const [styleTooltipPos, setStyleTooltipPos] = useState({ top: 0, left: 0 });
  const [styleBubbleText, setStyleBubbleText] = useState('');
  const [styleBubblePos, setStyleBubblePos] = useState({ top: 0, left: 0 });

  const handleModeHover = (mode, e) => {
    if (isDesktop) {
      setHoveredMode(mode);
      if (mode) {
        const rect = e.currentTarget.getBoundingClientRect();
        setStyleTooltipPos({
          top: rect.top - 10,
          left: rect.left + rect.width / 2,
        });
      }
    }
  };
  
  const handleStyleClick = (mode, e) => {
    onModeClick(mode)
    if (!isDesktop) {
      const rect = e.currentTarget.getBoundingClientRect();
      setStyleBubbleText(modes[mode].name);
      setStyleBubblePos({
        top: rect.top - 40,
        left: rect.left + rect.width / 2,
      });
      setTimeout(() => setStyleBubbleText(''), 1500);
    }
  };

  const handleCameraSwitch = () => {
    if (isDesktop) {
      setDesktopMirror(prev => !prev);
    } else {
      setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    }
  };
  
  const handlePreviewClick = () => {
    if (isDesktop) {
      setGalleryVisible(prev => !prev);
    } else if (latestFinishedPhoto) {
      setFocusedId(latestFinishedPhoto.id);
    }
  };

  const isTimerActive = cameraMode === 'TIMER';

  return (
    <>
    {isTimerActive && !autoCapture && (
      <div className="iphoneTimerActiveDisplay">
        <span className="icon">timer</span>
        <span>5s</span>
      </div>
    )}
    <div className="iphoneCameraControls">
      {!isStreaming && (isDesktop ? (
          <div className="modeRows">
            <ul className="filterSelector">
              <li
                key="custom"
                onMouseEnter={e =>
                  handleModeHover({key: 'custom', name: 'Custom', prompt: customPrompt}, e)
                }
                onMouseLeave={() => handleModeHover(null)}
              >
                <button
                  className={c({active: activeMode === 'custom'})}
                  onClick={() => {
                    onModeClick('custom');
                    setShowCustomPrompt(true);
                  }}
                >
                  <span>✏️</span> <p>Custom</p>
                </button>
              </li>
              {Object.entries(modes).map(([key, {name, emoji, prompt}]) => (
                <li
                  key={key}
                  onMouseEnter={e => handleModeHover({key, name, prompt}, e)}
                  onMouseLeave={() => handleModeHover(null)}
                >
                  <button
                    onClick={() => onModeClick(key)}
                    className={c({active: key === activeMode})}
                  >
                    <span>{emoji}</span> <p>{name}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="iphoneStylesGrid">
            {modeKeys.map(key => (
              <button
                key={key}
                className={c('iphoneStyleEmojiBtn', { active: activeMode === key })}
                onClick={(e) => handleStyleClick(key, e)}
              >
                {modes[key].emoji}
              </button>
            ))}
            <button
              key="custom"
              className={c('iphoneStyleEmojiBtn', { active: activeMode === 'custom' })}
              onClick={() => {
                onModeClick('custom');
                setShowCustomPrompt(true);
              }}
            >
              ✏️
            </button>
          </div>
        )
      )}
      
      <div className={c("iphoneCameraModesAndShutterWrapper", {streaming: isStreaming})}>
        {!isStreaming && (
            <div className="iphoneCameraModes">
              <button
                className={c('iphoneModeBtn', { active: cameraMode === 'STREAM' })}
                onClick={() => setCameraMode('STREAM')}
              >
                STREAM
              </button>
              <button
                className={c('iphoneModeBtn', { active: cameraMode === 'PHOTO' })}
                onClick={() => setCameraMode('PHOTO')}
              >
                PHOTO
              </button>
              <button
                className={c('iphoneModeBtn', { active: cameraMode === 'POSTCARD' })}
                onClick={() => setCameraMode('POSTCARD')}
              >
                POSTCARD
              </button>
              <button
                className={c('iphoneModeBtn', { active: cameraMode === 'TIMER' })}
                onClick={() => setCameraMode('TIMER')}
              >
                TIMER
              </button>
            </div>
        )}
        
        <div className="iphoneCameraBottom">
          {!hideControls && (
            <div className="iphonePhotoPreview">
              {latestFinishedPhoto ? (
                <button className="iphonePreviewBtn" onClick={handlePreviewClick}>
                  <img className="iphonePreviewImg" src={imageData.outputs[latestFinishedPhoto.id]} alt="Latest photo preview" />
                  {busyPhotos.length > 0 && <div className="queue-counter">{busyPhotos.length}</div>}
                </button>
              ) : (
                photos.length === 0 ? <div className="iphonePhotoPreview-placeholder"/> :
                <button className="iphonePreviewEmpty" onClick={handlePreviewClick}>
                  <span className="icon">photo_library</span>
                  {busyPhotos.length > 0 && <div className="queue-counter">{busyPhotos.length}</div>}
                </button>
              )}
            </div>
          )}

          <div className="iphoneCameraShutter">
            <button
              className={c('iphoneShutterBtn', { recording: autoCapture })}
              onClick={onShutterClick}
              disabled={isCountingDown}
            >
              <div className={c('iphoneShutterInner', { recording: autoCapture })} />
            </button>
          </div>

          <div className="iphoneCameraSwitch">
             <button className="iphoneSwitchBtn" onClick={handleCameraSwitch}>
              <span className="icon">
                {isDesktop ? 'flip_camera_android' : (facingMode === 'user' ? 'cameraswitch' : 'flip_camera_android')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    {hoveredMode && isDesktop && (
      <div
        className="tooltip"
        style={{
          top: styleTooltipPos.top,
          left: styleTooltipPos.left,
        }}
      >
        <p>{hoveredMode.name}</p>
      </div>
    )}
      
    {styleBubbleText && !isDesktop && (
      <div
        className="styleBubble"
        style={{
          top: styleBubblePos.top,
          left: styleBubblePos.left,
        }}
    >
      {styleBubbleText}
    </div>
    )}
  </>
  )
}

function ErrorToast({ error, onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (error) {
      setIsVisible(true)
      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for fade out animation
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, onClose])
  
  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }
  
  if (!error) return null
  
  const getFriendlyMessage = (error) => {
    if (error.message?.includes('Aborted') || error.message?.includes('aborted')) {
      return 'Photo generation was cancelled'
    }
    if (error.message?.includes('API')) {
      return 'Having trouble connecting to our AI service. Please try again.'
    }
    if (error.message?.includes('content restrictions')) {
      return 'This image couldn\'t be processed due to content guidelines'
    }
    if (error.message?.includes('No image was generated')) {
      return 'Unable to generate image. Please check your connection and try again.'
    }
    return 'Something went wrong while creating your image. Please try again.'
  }
  
  return (
    <div className={c('errorToast', { visible: isVisible })}>
      <div className="errorToastContent">
        <span className="icon">error</span>
        <span className="errorMessage">{getFriendlyMessage(error)}</span>
        <button className="errorToastClose" onClick={handleClose}>
          <span className="icon">close</span>
        </button>
      </div>
    </div>
  )
}