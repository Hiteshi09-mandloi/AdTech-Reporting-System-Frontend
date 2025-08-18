
import React from 'react';
import { ConfigProvider, theme } from 'antd';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          colorBgBase: '#141414',
          colorTextBase: '#ffffff',
        },
      }}
    >
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#141414',
        color: '#ffffff'
      }}>
        <DashboardPage />
        


      </div>
    </ConfigProvider>
  );
}

export default App;





/*
App sets up your dark theme globally using Ant Design’s ConfigProvider.

It applies custom colors for background, text, and primary elements.

The div ensures the entire screen uses dark mode styling.

Inside it, your DashboardPage is rendered.

*/

