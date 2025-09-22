import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NEXT_PUBLIC_GROK_API_KEY: process.env.NEXT_PUBLIC_GROK_API_KEY,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    NEXT_PUBLIC_HELIUS_API_KEY: process.env.NEXT_PUBLIC_HELIUS_API_KEY,
    NEXT_PUBLIC_BIRDEYE_API_KEY: process.env.NEXT_PUBLIC_BIRDEYE_API_KEY,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NODE_ENV: process.env.NODE_ENV,
    // Check if Railway is setting them without NEXT_PUBLIC_ prefix
    GROK_API_KEY: process.env.GROK_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
    XAI_API_KEY: process.env.XAI_API_KEY,
  };

  return NextResponse.json({
    message: 'Environment variables check',
    envVars,
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('GROK') || 
      key.includes('OPENAI') || 
      key.includes('HELIUS') || 
      key.includes('BIRDEYE') ||
      key.includes('XAI') ||
      key.includes('NEXT_PUBLIC')
    )
  });
}
