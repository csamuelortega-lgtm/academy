import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FaDatabase, FaLock, FaSignInAlt, FaUserCircle } from 'react-icons/fa';

import { useAuth } from './auth';
import './auth-pages.css';

const featureList = [
  'Sesión protegida y validada contra CouchDB.',
  'Acceso directo a tu espacio de usuario.',
  'Cierre de sesión inmediato desde cualquier pantalla.',
];

const LoginPage = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/usuario';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login({ identifier, password });
      navigate(from, { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page auth-page--centered">
        <div className="auth-card auth-card--compact auth-card--loading">
          <span className="auth-badge">Validando acceso</span>
          <h1>Comprobando tu sesión</h1>
          <p>Estamos conectando con CouchDB para restaurar tu cuenta.</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-grid">
        <section className="auth-hero auth-card">
          <span className="auth-badge">Login + sesión de usuario</span>
          <h1>Accede a tu espacio conectado a CouchDB</h1>
          <p className="auth-lead">
            Inicia sesión con tu correo o usuario, entra a tu área privada y cierra sesión cuando termines.
          </p>

          <div className="auth-hero-panel">
            <div className="auth-hero-icon">
              <FaDatabase />
            </div>
            <div>
              <h2>Base de usuarios</h2>
              <p>La autenticación consulta la colección configurada en tu backend de CouchDB.</p>
            </div>
          </div>

          <ul className="auth-feature-list">
            {featureList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="auth-card auth-form-card">
          <div className="auth-form-header">
            <FaUserCircle className="auth-form-avatar" />
            <div>
              <span className="auth-badge auth-badge--soft">Bienvenido</span>
              <h2>Iniciar sesión</h2>
              <p>Usa el correo o el usuario guardado en CouchDB.</p>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Correo o usuario</span>
              <div className="auth-input-wrap">
                <FaUserCircle />
                <input
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="usuario@correo.com"
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Contraseña</span>
              <div className="auth-input-wrap">
                <FaLock />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>

            {error ? <div className="auth-error">{error}</div> : null}

            <button className="auth-primary-button" type="submit" disabled={submitting}>
              <FaSignInAlt />
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>

            <p className="auth-note">
              El backend debe exponer las credenciales de CouchDB y la colección de usuarios configurada.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
