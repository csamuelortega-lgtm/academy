import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FaCode, FaDatabase, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

import { useAuth } from './auth';
import './auth-pages.css';

const UserSpace = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="auth-page auth-page--centered">
        <div className="auth-card auth-card--compact auth-card--loading">
          <span className="auth-badge">Cargando espacio</span>
          <h1>Preparando tu panel</h1>
          <p>Recuperando datos de sesión.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const displayName = user?.name || user?.fullName || user?.username || user?.email || 'Usuario';
  const identifier = user?.email || user?.username || 'Sin identificar';
  const role = user?.role || user?.type || 'usuario';
  const documentId = user?.id || user?._id || 'sin-id';

  return (
    <div className="auth-page user-page">
      <div className="user-layout">
        <aside className="auth-card user-hero">
          <span className="auth-badge">Espacio de usuario</span>
          <div className="user-avatar">
            <FaUserCircle />
          </div>
          <h1>{displayName}</h1>
          <p className="auth-lead">
            Tu sesión está activa y vinculada al documento almacenado en CouchDB.
          </p>

          <div className="user-actions">
            <button className="auth-secondary-button" type="button" onClick={() => navigate('/editor')}>
              <FaCode />
              Abrir editor
            </button>
            <button className="auth-primary-button" type="button" onClick={handleLogout}>
              <FaSignOutAlt />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <section className="user-dashboard">
          <article className="auth-card user-stat-card">
            <FaDatabase className="user-stat-icon" />
            <div>
              <span className="user-stat-label">Cuenta conectada</span>
              <strong>{identifier}</strong>
              <p>Documento de CouchDB: {documentId}</p>
            </div>
          </article>

          <article className="auth-card user-stat-card">
            <FaUserCircle className="user-stat-icon" />
            <div>
              <span className="user-stat-label">Rol</span>
              <strong>{role}</strong>
              <p>La información se muestra desde el perfil autenticado.</p>
            </div>
          </article>

          <article className="auth-card user-info-card">
            <h2>Acciones rápidas</h2>
            <div className="user-timeline">
              <div>
                <span>1</span>
                <p>Revisa tu información de sesión.</p>
              </div>
              <div>
                <span>2</span>
                <p>Entra al editor o a cualquier área privada.</p>
              </div>
              <div>
                <span>3</span>
                <p>Cierra sesión para vaciar el acceso del navegador.</p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default UserSpace;
