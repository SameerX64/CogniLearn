# 🔑 API Keys Setup Guide

This guide will help you set up the required API keys for CogniLearn AI services.

## Required API Keys

### 1. **Google Gemini API Key (REQUIRED)**

The Gemini API is used for content generation, quiz creation, and educational content analysis.

**How to get it:**
1. Visit: [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

**Setup:**
1. Copy `ai-services/.env.example` to `ai-services/.env`
2. Replace `your_gemini_api_key_here` with your actual key:
   ```
   GEMINI_API_KEY=AIzaSyC_your_actual_api_key_here
   ```

### 2. **NVIDIA API Key (OPTIONAL)**

NVIDIA API provides access to advanced language models like Llama 3 70B for enhanced AI capabilities.

**How to get it:**
1. Visit: [NVIDIA Developer Portal](https://developer.nvidia.com/)
2. Create an account or sign in
3. Navigate to the API section
4. Generate an API key

**Alternative sources:**
- [NVIDIA NGC](https://ngc.nvidia.com/)
- [NVIDIA Build Platform](https://build.nvidia.com/)

**Setup:**
1. In your `ai-services/.env` file, replace `your_nvidia_api_key_here` with your actual key:
   ```
   NVIDIA_API_KEY=nvapi-your_actual_key_here
   ```

## Backend Configuration

For the backend service, copy `backend/.env.example` to `backend/.env` and update the following:

- `JWT_SECRET`: Generate a strong random string for JWT token signing
- `MONGODB_URI`: Your MongoDB connection string
- `SUPABASE_URL` & `SUPABASE_SERVICE_KEY`: If using Supabase for additional features

## Testing Your Setup

After adding the Gemini API key, test if it works:

```bash
cd ai-services
python test_api.py
```

## Troubleshooting

### Common Issues:

#### Google Gemini:
- **Invalid API Key**: Ensure you copied the complete key
- **Quota Exceeded**: Check your API usage limits in Google AI Studio
- **Region Restrictions**: Some regions may have limited access

#### NVIDIA:
- **Authentication Error**: Verify your API key is active
- **Model Access**: Ensure you have access to the specific models

## Security Notes

- **Never commit `.env` files** to version control
- **Use environment variables** in production
- **Rotate API keys** regularly
- **Monitor API usage** to prevent unexpected charges

## Need Help?

If you encounter issues:
1. Check the [Google AI Documentation](https://ai.google.dev/docs)
2. Visit [NVIDIA Developer Forums](https://developer.nvidia.com/forums)
3. Review our troubleshooting section in the main README
