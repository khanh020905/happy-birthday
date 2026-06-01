import { QRCodeSVG } from 'qrcode.react';

const SITE_URL = 'https://happy-birthday-thanh-nhan.vercel.app/';

export default function QRPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff0f6 0%, #f8f0ff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Dancing Script", cursive',
      padding: '2rem',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <p style={{ fontSize: '2.8rem', margin: '0 0 0.2rem', lineHeight: 1 }}>🎂</p>
      <h1 style={{
        fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
        margin: '0.4rem 0 0.3rem',
        background: 'linear-gradient(135deg, #ff6b9d, #c9b1ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        Happy Birthday Thanh Nhàn!
      </h1>
      <p style={{
        color: '#b06090',
        fontSize: '1.1rem',
        margin: '0 0 2rem',
        textAlign: 'center',
        fontFamily: '"Dancing Script", cursive',
      }}>
        Scan để mở bất ngờ sinh nhật 🎁
      </p>

      {/* QR card */}
      <div style={{
        background: '#fff',
        padding: '1.6rem',
        borderRadius: '1.25rem',
        boxShadow: '0 6px 32px rgba(255, 107, 157, 0.2), 0 2px 8px rgba(0,0,0,0.06)',
        border: '2px solid rgba(255, 107, 157, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <QRCodeSVG
          value={SITE_URL}
          size={260}
          bgColor="#ffffff"
          fgColor="#2d0050"
          level="H"
          includeMargin={false}
        />

        <div style={{
          width: '260px',
          height: '1px',
          background: 'linear-gradient(to right, transparent, #ff6b9d 30%, #c9b1ff 70%, transparent)',
        }} />

        <p style={{
          margin: 0,
          color: '#c9b1ff',
          fontSize: '0.78rem',
          wordBreak: 'break-all',
          textAlign: 'center',
          maxWidth: '260px',
          fontFamily: 'monospace',
          letterSpacing: '0.01em',
        }}>
          {SITE_URL}
        </p>
      </div>

      <p style={{
        marginTop: '2rem',
        color: '#d090b0',
        fontSize: '0.95rem',
        textAlign: 'center',
        fontFamily: '"Dancing Script", cursive',
      }}>
        Chúc Nhàn tuổi mới thật nhiều niềm vui! ✨
      </p>
    </div>
  );
}
