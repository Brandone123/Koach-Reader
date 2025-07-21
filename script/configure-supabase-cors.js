// Script to configure CORS settings for Supabase Storage
// Run this script with Node.js after installing the required packages

const { createClient } = require('@supabase/supabase-js');

// Replace these with your actual Supabase URL and service role key
// You can find these in your Supabase dashboard under Settings > API
const SUPABASE_URL = 'https://amjodckmmxmpholspskm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'; // Replace with your actual service role key

// Initialize Supabase client with service role key
// WARNING: Service role key has admin privileges, so keep it secure
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS configuration
const corsSettings = {
  allowed_origins: ['*'], // For production, replace with your specific domains
  allowed_methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowed_headers: ['Authorization', 'Content-Type', 'Accept', 'Origin', 'User-Agent'],
  max_age_seconds: 3600,
  expose_headers: ['Content-Length', 'Content-Range']
};

async function configureCors() {
  try {
    // Endpoint for updating storage configuration
    const response = await fetch(`${SUPABASE_URL}/storage/v1/cors`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(corsSettings)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update CORS settings: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('CORS settings updated successfully:', data);
  } catch (error) {
    console.error('Error updating CORS settings:', error);
  }
}

// Run the configuration
configureCors();

/*
USAGE INSTRUCTIONS:

1. Install required packages:
   npm install @supabase/supabase-js node-fetch

2. Replace the placeholder values:
   - SUPABASE_URL: Your Supabase project URL
   - SUPABASE_SERVICE_ROLE_KEY: Your service role key (found in Project Settings > API)

3. Run the script:
   node configure-supabase-cors.js

ALTERNATIVE METHOD:

You can also configure CORS through the Supabase dashboard:
1. Go to Storage > Settings
2. Under CORS Configuration, add your settings
3. Click Save

*/ 