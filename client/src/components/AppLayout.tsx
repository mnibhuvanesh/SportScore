import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            padding: '2rem',
            backgroundColor: 'var(--color-surface-bg)',
            overflowY: 'auto',
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
