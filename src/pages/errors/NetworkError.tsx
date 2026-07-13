import React from 'react';

export default function NetworkError() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', backgroundColor: 'var(--bg-body, #f8fafc)', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'white', padding: '40px', borderRadius: '12px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        textAlign: 'center', maxWidth: '500px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔌</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
          Network Connection Error
        </h1>
        <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
          We couldn't connect to the server. This might be due to a CORS issue, 
          server maintenance, or a temporary network outage.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#3b82f6', color: 'white', padding: '10px 20px', 
            borderRadius: '6px', border: 'none', fontWeight: '500', 
            cursor: 'pointer', transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
