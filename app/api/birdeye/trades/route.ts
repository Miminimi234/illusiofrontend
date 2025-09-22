import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = searchParams.get('limit') || '20';
    
    if (!address) {
      return NextResponse.json({ error: 'address parameter is required' }, { status: 400 });
    }
    
    const apiKey = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Birdeye API key not configured' }, { status: 500 });
    }
    
    console.log('🔍 Fetching Birdeye trades for address:', address);
    
    // Call Birdeye API
    const birdeyeUrl = `https://public-api.birdeye.so/defi/v3/token/txs?address=${address}&limit=${limit}`;
    console.log('📤 Birdeye API URL:', birdeyeUrl);
    
    const response = await fetch(birdeyeUrl, {
      headers: {
        "X-API-KEY": apiKey,
        "accept": "application/json",
        "x-chain": "solana",
      },
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Birdeye API error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch trades data', details: errorData }, { status: response.status });
    }
    
    const data = await response.json();
    console.log('📦 Raw Birdeye response:', JSON.stringify(data, null, 2));
    console.log('✅ Trades fetched successfully, count:', data.data?.items?.length || 0);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Error fetching Birdeye trades:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch trades data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
