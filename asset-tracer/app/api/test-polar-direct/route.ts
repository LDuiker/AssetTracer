import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.POLAR_API_KEY;
    const baseUrl = process.env.POLAR_BASE_URL || 'https://api.polar.sh';
    
    console.log('Testing direct Polar.sh API call...');
    console.log('API Key:', apiKey?.substring(0, 20) + '...');
    console.log('Base URL:', baseUrl);
    
    // Try the organizations endpoint to validate token
    const response = await fetch(`${baseUrl}/v1/organizations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        statusText: response.statusText,
        body: responseText,
        headers: Object.fromEntries(response.headers.entries()),
      }, { status: response.status });
    }
    
    const data = JSON.parse(responseText);
    
    return NextResponse.json({
      success: true,
      message: 'Direct API call successful!',
      data,
    });
  } catch (error: unknown) {
    console.error('Direct API test error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({
      success: false,
      error: message,
      stack,
    }, { status: 500 });
  }
}

