# OurHairitage Bot Setup Guide

## Local Development

Create a `.env` file in the root directory with the following variables:

```env
# OpenAI API Configuration (for serverless functions)
OPENAI_API_KEY=your_openai_api_key_here

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

## Vercel Deployment

### Environment Variables for Vercel
Set these in your Vercel dashboard:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Add the environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Security Features

✅ **Secure**: OpenAI API key is kept server-side in Vercel functions
✅ **Client-safe**: No sensitive keys exposed in browser
✅ **Serverless**: Automatic scaling with Vercel

## Running the App

```bash
npm install
npm run dev
```

## Database Setup

Run the SQL from `database-schema.sql` in your Supabase SQL Editor to create the required tables.
