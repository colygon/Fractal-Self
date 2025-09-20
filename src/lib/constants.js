/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// App Configuration Constants
export const CONFIG = {
  // Photo capture settings
  MIN_IMAGE_DATA_SIZE: 1000,
  VIDEO_DIMENSIONS: {
    WIDTH: 1920,
    HEIGHT: 1080
  },
  
  // Credit system
  PHOTO_COST: 5,
  FREE_PHOTO_LIMIT: 10,
  DEFAULT_FREE_CREDITS: 50,
  DEFAULT_LOGGED_IN_CREDITS: 5000,
  
  // Timer settings
  COUNTDOWN_DURATION: 5,
  FLASH_DURATION: 300,
  AUTO_CAPTURE_INTERVAL: 5000,
  
  // UI breakpoints
  DESKTOP_BREAKPOINT: 768,
  
  // Storage settings
  PHOTO_CLEANUP_AGE: 30000, // 30 seconds
  
  // Replay settings
  REPLAY_INTERVAL: 1500,
  MAX_SELECTED_PHOTOS: 10,
  MAX_RECENT_PHOTOS: 5,
  
  // GIF settings
  GIF_MAX_SIZE: 640,
  GIF_FRAME_DELAY: 333,
  
  // Error handling
  ERROR_TOAST_DURATION: 3000,
  ERROR_FADE_DURATION: 300,
  
  // Touch gestures
  MAX_SWIPE_TIME: 500,
  MIN_SWIPE_DISTANCE: 100,
  
  // Style bubble duration
  STYLE_BUBBLE_DURATION: 1500
};
