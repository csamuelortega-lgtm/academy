import React from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { createRoot } from 'react-dom/client';

import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';

import './style.css'

import Editor from './editor'
import Home from './home'
import HomeSostenibilidad from './HomeSostenibilidad'
import HomeExperiencias from './HomeExperiencias'
import MixMastersDrinks from './MixMastersDrinks'
import { AuthProvider, useAuth } from './auth'

import Test from './editor/test/001/index.jsx'


const root = createRoot(document.getElementById("app"));

const LoadingScreen = () => (
  <div className="auth-loading-screen">
    <div className="auth-loading-card">
      <div className="auth-loading-pill">Cargando sesión</div>
      <h1>Preparando tu espacio</h1>
      <p>Verificando el acceso contra CouchDB.</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/mixmastersdrinks" replace state={{ from: location }} />;
  }

  return children;
};

const Layout = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Editor />}
          />
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }
          />
          <Route path="/home" element={<Home />} />
          <Route path="/home-sostenibilidad" element={<HomeSostenibilidad />} />
          <Route path="/home-experiencias" element={<HomeExperiencias />} />
          <Route path="/mixmastersdrinks/*" element={<MixMastersDrinks />} />
          <Route path="/test/*" element={<Test />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

root.render(<Layout />);
