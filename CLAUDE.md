# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Install dependencies
npm install

# Start development server (default port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### API Configuration
Before running the app, you need a Google Gemini API key:
1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. The key can be configured via the UI settings panel or set in `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### Authentication (Clerk)
Clerk provides authentication and user management for the app.

#### Clerk Setup:
1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Copy your publishable key and secret key
3. Configure environment variables:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuYmFuYW5hLmNhbSQ
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```
4. Ensure the frontend origin is whitelisted in the Clerk dashboard (`https://clerk.banana.cam`)
5. Optional: update the JWKS URL if hosting on a different domain (current: `https://clerk.banana.cam/.well-known/jwks.json`)

The React app wraps the root component with `ClerkProvider`. Sign-in/sign-out controls live in the header via Clerk's `SignInButton` and `UserButton`. For API access, authenticated routes use `@clerk/express` middleware.

### Billing (RevenueCat)
The app uses RevenueCat for subscription billing alongside Clerk-authenticated users:

#### RevenueCat Setup:
1. Create a RevenueCat project at [revenuecat.com](https://revenuecat.com)
2. Get your public API key from the RevenueCat dashboard
3. Add to `.env.local`:
   ```
   VITE_REVENUECAT_API_KEY=your_revenuecat_public_api_key_here
   ```
4. Set up your products and offerings in the RevenueCat dashboard
5. Configure entitlements for your subscription plans

#### User Flow:
- Guests receive 50 local credits on first visit
- Signed-in users sync their RevenueCat identity and keep a per-account credit balance in localStorage
- Click the credits display or "Upgrade" button to open the RevenueCat modal
- RevenueCat handles all payment processing and entitlements
- Premium subscribers get unlimited credits (displayed as ∞)

#### Billing Tiers:
- **Free**: 10 photos per month, basic styles, watermarked exports
- **Starter ($3.99/month)**: 100 photos per month, all styles, standard quality, watermarked exports
- **Premium ($39.99/month)**: 1,000 photos per month, all styles, high quality, no watermarks, GIF creation
- **Gold ($399.99/month)**: 10,000 photos per month, all features, ultra quality, custom prompts, API access

## Architecture

This is a React single-page application that transforms webcam photos using Google's Gemini AI. The codebase uses a modular architecture with Zustand for state management and Vite as the build tool.

### Core Modules

- **`src/lib/store.js`**: Global state management using Zustand with Immer middleware. Contains all application state including photos array, API keys, UI modes, and user preferences.

- **`src/lib/actions.js`**: Business logic layer that handles photo capture, AI processing, GIF creation, and localStorage persistence. Key functions:
  - `snapPhoto()`: Captures webcam and triggers AI transformation
  - `makeGif()`: Creates animated GIFs from photo collection
  - `savePhotos()`/`loadPhotos()`: Manages localStorage persistence

- **`src/lib/llm.js`**: Google Gemini AI integration with:
  - Multi-key rotation for rate limit management
  - Concurrent request limiting (max 2)
  - Retry logic with exponential backoff
  - AbortController support for cancellation

- **`src/lib/imageData.js`**: In-memory storage for base64 encoded images, separated into `inputs` (webcam captures) and `outputs` (AI generated).

- **`src/lib/modes.js`**: Contains 12+ predefined art style transformation prompts plus support for custom user prompts.

- **`src/components/App.jsx`**: Main React component handling webcam integration, UI rendering, timer management, and user interactions.

### Key Implementation Details

- **Image Processing**: Webcam → Canvas (640x480) → Base64 JPEG → AI API → Base64 PNG response
- **Concurrency Control**: Uses `p-limit` to restrict simultaneous AI requests to 2
- **Memory Management**: Automatically removes old photos when count exceeds 10
- **API Key Rotation**: Automatic rotation through 4 backup API keys to handle rate limits
  - Keys are tried sequentially until one succeeds
  - Detailed logging shows which key is being used and rotation status
  - Rate limit detection with fallback to next available key
- **GIF Generation**: Client-side using `gifenc` library, processes up to 5 recent images at 512x512

### State Flow

1. User captures photo via webcam
2. Image stored in `imageData.inputs` and photo metadata added to store
3. AI request sent with selected mode's prompt
4. Generated image stored in `imageData.outputs`
5. UI re-renders with updated state
6. Optional: Save to localStorage for persistence

### UI Features

- **Live Mode**: Auto-cycles through generated images every 500ms
- **Auto-Capture**: Configurable interval (1-100 seconds) with countdown
- **Replay Mode**: Slideshow of generated images
- **Custom Prompts**: User-defined transformation prompts
- **Multi-Key Support**: Up to 5 API keys with automatic rotation
