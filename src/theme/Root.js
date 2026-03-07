import React from 'react';
import { useLocation } from '@docusaurus/router';
import { ToastProvider } from '@site/src/components/Toast';

function ResetDemo() {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <button 
      onClick={() => {
        if(window.confirm("Reload initial demo data? This will clear all current settings/files and restart the demo state.")){
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
        }
      }}
      title="Reset to Initial Demo State"
      style={{
        position: 'fixed', bottom: '20px', left: '20px', zIndex: 99999,
        padding: '10px', background: '#3b82f6', color: 'white',
        border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50px', cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)', fontWeight: 'bold',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '45px', height: '45px', fontSize: '1.2rem', padding: 0
      }}
    >
      🔄
    </button>
  );
}

// Default implementation, that you can customize
export default function Root({children}) {
  return (
    <ToastProvider>
      {children}
      <ResetDemo />
    </ToastProvider>
  );
}

