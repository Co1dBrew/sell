import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { DataProvider } from './hooks/useData';
import { MobileLayout } from './components/layout/MobileLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
// import { TransactionIn } from './pages/TransactionIn'; // 屏蔽入库记录
import { TransactionOut } from './pages/TransactionOut';
import { History } from './pages/History';
import { Products } from './pages/Products';
import { Drivers } from './pages/Drivers';
import { Customers } from './pages/Customers';

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MobileLayout>
                  <Dashboard />
                </MobileLayout>
              </ProtectedRoute>
            } />
            
            {/* 屏蔽入库记录路由
            <Route path="/transactions/in" element={
              <ProtectedRoute>
                <MobileLayout>
                  <TransactionIn />
                </MobileLayout>
              </ProtectedRoute>
            } />
            */}
            
            <Route path="/transactions/out" element={
              <ProtectedRoute>
                <MobileLayout>
                  <TransactionOut />
                </MobileLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/history" element={
              <ProtectedRoute>
                <MobileLayout>
                  <History />
                </MobileLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/customers" element={
              <ProtectedRoute>
                <MobileLayout>
                  <Customers />
                </MobileLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/products" element={
              <ProtectedRoute>
                <MobileLayout>
                  <Products />
                </MobileLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/drivers" element={
              <ProtectedRoute>
                <MobileLayout>
                  <Drivers />
                </MobileLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<Navigate to="/transactions/out" replace />} />
            <Route path="*" element={<Navigate to="/transactions/out" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;