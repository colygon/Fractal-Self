#!/usr/bin/env node
/**
 * Test script for RevenueCat integration
 * Run with: node test-revenuecat-integration.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY;
const REVENUECAT_PUBLIC_KEY = process.env.VITE_REVENUECAT_API_KEY;

console.log('🔧 RevenueCat Integration Test');
console.log('================================');
console.log('');

// Check API keys
console.log('📝 API Key Configuration:');
console.log(`  Public Key (Web SDK): ${REVENUECAT_PUBLIC_KEY ? '✅ Found' : '❌ Missing'}`);
console.log(`  Secret Key (Server): ${REVENUECAT_API_KEY ? '✅ Found' : '❌ Missing'}`);
console.log('');

if (!REVENUECAT_API_KEY) {
  console.error('❌ REVENUECAT_API_KEY not found in environment');
  process.exit(1);
}

// Test RevenueCat API endpoints
async function testRevenueCatAPI() {
  console.log('🧪 Testing RevenueCat API Connection...');

  try {
    // Test 1: Get project info
    console.log('\n1️⃣ Testing Project Info Endpoint...');
    const projectResponse = await fetch('https://api.revenuecat.com/v2/projects', {
      headers: {
        'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!projectResponse.ok) {
      throw new Error(`Project API returned ${projectResponse.status}: ${await projectResponse.text()}`);
    }

    const projects = await projectResponse.json();
    console.log(`   ✅ Successfully connected to RevenueCat`);
    console.log(`   📊 Projects found: ${projects.items?.length || 0}`);

    // Test 2: Get offerings
    console.log('\n2️⃣ Testing Offerings Endpoint...');
    const projectId = projects.items?.[0]?.id;

    if (projectId) {
      const offeringsResponse = await fetch(`https://api.revenuecat.com/v2/projects/${projectId}/offerings`, {
        headers: {
          'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (offeringsResponse.ok) {
        const offerings = await offeringsResponse.json();
        console.log(`   ✅ Offerings retrieved successfully`);
        console.log(`   📦 Offerings count: ${offerings.items?.length || 0}`);

        // List offerings
        if (offerings.items?.length > 0) {
          console.log('\n   Available Offerings:');
          offerings.items.forEach(offering => {
            console.log(`     - ${offering.lookup_key}: ${offering.display_name || 'No name'}`);
          });
        }
      } else {
        console.warn(`   ⚠️  Could not fetch offerings: ${offeringsResponse.status}`);
      }
    }

    // Test 3: Check virtual currency setup
    console.log('\n3️⃣ Testing Virtual Currency Support...');
    console.log(`   ℹ️  Virtual currency must be configured in RevenueCat dashboard`);
    console.log(`   📍 Go to: https://app.revenuecat.com/projects/${projectId}/setup/virtual-currency`);

    // Test 4: Check products
    console.log('\n4️⃣ Checking Products Configuration...');
    if (projectId) {
      const productsResponse = await fetch(`https://api.revenuecat.com/v2/projects/${projectId}/products`, {
        headers: {
          'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (productsResponse.ok) {
        const products = await productsResponse.json();
        console.log(`   ✅ Products retrieved successfully`);
        console.log(`   📦 Products count: ${products.items?.length || 0}`);

        // List products
        if (products.items?.length > 0) {
          console.log('\n   Available Products:');
          products.items.forEach(product => {
            console.log(`     - ${product.store_identifier}: ${product.display_name || 'No name'}`);
          });
        }
      } else {
        console.warn(`   ⚠️  Could not fetch products: ${productsResponse.status}`);
      }
    }

    console.log('\n✨ RevenueCat API integration test completed successfully!');

    // Provide setup instructions
    console.log('\n📋 Next Steps:');
    console.log('1. Configure products in RevenueCat dashboard');
    console.log('2. Create offerings and packages');
    console.log('3. Set up virtual currency if needed');
    console.log('4. Configure webhook endpoint: https://banana.cam/api/webhooks/revenuecat');
    console.log('5. Test purchases in development mode');

  } catch (error) {
    console.error('\n❌ RevenueCat API test failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Check API key is correct and active');
    console.error('2. Ensure API key has proper permissions');
    console.error('3. Check RevenueCat service status');
    process.exit(1);
  }
}

// Run the test
testRevenueCatAPI();