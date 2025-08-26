
import React from 'react';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#141414',
      margin: 0,
      padding: 0,
      overflow: 'auto'
    }}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            colorBgBase: '#141414',
            colorTextBase: '#ffffff',
            colorBgContainer: '#141414',
            colorBgElevated: '#1f1f1f',
            colorBgLayout: '#141414',
          },
          components: {
            App: {
              colorBgContainer: '#141414',
            },
          },
        }}
      >
        <AntdApp style={{
          backgroundColor: '#141414',
          margin: 0,
          padding: 0,
          minHeight: '100vh'
        }}>
          <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#141414',
            color: '#ffffff',
            margin: 0,
            padding: 0
          }}>
            <DashboardPage />
          </div>
        </AntdApp>
      </ConfigProvider>
    </div>
  );
}

export default App;

