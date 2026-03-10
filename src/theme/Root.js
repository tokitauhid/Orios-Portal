import React from 'react';
import { ToastProvider } from '@site/src/components/Toast';

// Default implementation, that you can customize
export default function Root({children}) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

