import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';
export const alt = 'AssetTracer - Professional Asset Management & Invoicing Software';
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
          background: 'linear-gradient(135deg, #2563EB 0%, #1e40af 50%, #0F172A 100%)',
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
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            zIndex: 1,
            textAlign: 'center',
            padding: '80px',
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                background: 'white',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                fontWeight: 'bold',
                color: '#2563EB',
              }}
            >
              AT
            </div>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              lineHeight: '1.1',
              textAlign: 'center',
              maxWidth: '1000px',
            }}
          >
            AssetTracer
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '32px',
              color: '#E0E7FF',
              margin: 0,
              lineHeight: '1.4',
              textAlign: 'center',
              maxWidth: '900px',
              fontWeight: 500,
            }}
          >
            Track Assets. Send Quotes. Know Your Profit.
          </p>

          {/* Description */}
          <p
            style={{
              fontSize: '24px',
              color: '#C7D2FE',
              margin: 0,
              marginTop: '16px',
              lineHeight: '1.5',
              textAlign: 'center',
              maxWidth: '800px',
              fontWeight: 400,
            }}
          >
            Professional asset management and invoicing software for growing businesses
          </p>

          {/* Feature Pills */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '32px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {['Asset Tracking', 'Invoicing', 'Profit Analytics'].map((feature) => (
              <div
                key={feature}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  padding: '12px 24px',
                  borderRadius: '24px',
                  fontSize: '20px',
                  color: 'white',
                  fontWeight: 500,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #06B6D4 0%, #2563EB 50%, #F97316 100%)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

