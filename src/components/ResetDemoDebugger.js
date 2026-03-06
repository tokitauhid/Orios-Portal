import React from 'react';

export default function ResetDemoDebugger() {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <button 
      onClick={() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      }}
      style={{
        position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
        padding: '10px 16px', background: '#ef4444', color: 'white',
        border: 'none', borderRadius: '8px', cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)', fontWeight: 'bold'
      }}
    >
      🔄 Hard Reset Demo State
    </button>
  );
}
