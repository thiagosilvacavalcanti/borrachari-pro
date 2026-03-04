import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Inventory } from './pages/Inventory';
import { Financial } from './pages/Financial';
import { Agenda } from './pages/Agenda';
import { Customers } from './pages/Customers';
import { SalesHistory } from './pages/SalesHistory';
import { Settings } from './pages/Settings';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/venda" element={<PrivateRoute><Sales /></PrivateRoute>} />
          <Route path="/estoque" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/financeiro" element={<PrivateRoute><Financial /></PrivateRoute>} />
          <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
          <Route path="/clientes" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="/historico" element={<PrivateRoute><SalesHistory /></PrivateRoute>} />
          <Route path="/configuracoes" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
