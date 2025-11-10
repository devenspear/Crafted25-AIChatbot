import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CRAFTED AI - Your Alys Beach Event Guide';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#004978',
          backgroundImage: 'linear-gradient(135deg, #004978 0%, #003355 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '60px',
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '0.05em',
              marginBottom: '30px',
              fontFamily: 'Georgia, serif',
            }}
          >
            CRAFTED AI
          </div>
          <div
            style={{
              fontSize: 42,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '20px',
              fontWeight: 300,
            }}
          >
            Your Intelligent Event Guide
          </div>
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 300,
            }}
          >
            Alys Beach, Florida • November 12–16, 2025
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
