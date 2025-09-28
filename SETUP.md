# OurHairitage Bot Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# OpenAI API Configuration
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration  
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

## Getting API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/login and go to API Keys
3. Create a new API key
4. Add it to your `.env` file

### Supabase Configuration
1. Your Supabase URL: `https://bkmbejthbyqujevayhhs.supabase.co`
2. Get your anon key from Supabase Dashboard → Settings → API
3. Add both to your `.env` file

## Important Notes

⚠️ **Security Warning**: The current setup includes OpenAI API calls from the browser for development. 

**For Production**: Move OpenAI API calls to a backend server to keep your API key secure.

## Running the App

```bash
npm install
npm run dev
```

## Database Setup

Run the SQL from `database-schema.sql` in your Supabase SQL Editor to create the required tables.
