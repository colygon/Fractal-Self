// Temporary workaround for autumn-js ERR_REQUIRE_ESM bug
// The autumn-js library has a compatibility issue with ES modules
// Until this is fixed, we return a meaningful error message

// Vercel serverless function handler - catch all autumn routes
module.exports = function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Return a temporary service unavailable message
  console.log('Autumn billing service temporarily disabled due to library compatibility issue');
  res.status(503).json({
    error: 'Billing service temporarily unavailable',
    message: 'The checkout system is undergoing maintenance. Please try again later.',
    code: 'SERVICE_MAINTENANCE'
  });
};