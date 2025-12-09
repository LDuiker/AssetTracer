import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';
export const alt = 'AssetTracer - Track Assets, Send Quotes, Know Your Profit';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to right, #2563EB 0%, #06B6D4 50%, #1d4ed8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background Pattern (matching hero section) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            zIndex: 1,
            textAlign: 'center',
            padding: '60px 80px',
            maxWidth: '1000px',
          }}
        >
          {/* Badge - FOR SMEs & GROWING TEAMS */}
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#A5F3FC',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            FOR SMEs & GROWING TEAMS
          </div>

          {/* Main Heading - Track Assets. Send Quotes. Know Your Profit. */}
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              lineHeight: '1.1',
              textAlign: 'center',
              maxWidth: '1000px',
            }}
          >
            Track Assets. Send Quotes.{' '}
            <br />
            Know Your Profit.
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '22px',
              color: '#DBEAFE',
              margin: 0,
              marginTop: '12px',
              lineHeight: '1.5',
              textAlign: 'center',
              maxWidth: '900px',
              fontWeight: 400,
            }}
          >
            The simplest way to manage assets, create invoices, and understand ROI — all from one lean, powerful dashboard.
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

