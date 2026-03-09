import React from 'react';
import './home.css';

export default function HomeSostenibilidad() {
  return (
    <div className="landing">
      <header className="header">
        <div className="logo">Coca-Cola</div>
        <nav className="nav">
          <a href="#planeta">Planeta</a>
          <a href="#comunidad">Comunidad</a>
          <a href="#compromisos">Compromisos</a>
        </nav>
      </header>

      <section className="hero hero-sostenibilidad">
        <div className="hero-content">
          <h1>Cada sorbo cuenta</h1>
          <p>Coca-Cola trabajando por un futuro más sostenible para las personas y el planeta.</p>
          <button className="btn-primary btn-primary-light">Conoce nuestras iniciativas</button>
        </div>
      </section>

      <section id="planeta" className="section section-planeta">
        <h2>Cuidando del planeta</h2>
        <div className="grid-3">
          <div className="card card-soft">
            <h3>Envases circulares</h3>
            <p>Impulsamos el uso de envases retornables y material 100% reciclable en nuestros productos.</p>
          </div>
          <div className="card card-soft">
            <h3>Uso responsable del agua</h3>
            <p>Devolvemos al medio ambiente el equivalente al 100% del agua que utilizamos en nuestras bebidas.</p>
          </div>
          <div className="card card-soft">
            <h3>Energía y clima</h3>
            <p>Reducimos nuestra huella de carbono apostando por energía renovable en nuestras operaciones.</p>
          </div>
        </div>
      </section>

      <section id="comunidad" className="section section-comunidad">
        <h2>Impacto en la comunidad</h2>
        <div className="grid-3">
          <div className="card card-outline">
            <h3>Programas juveniles</h3>
            <p>Formación y becas para que los jóvenes desarrollen todo su potencial.</p>
          </div>
          <div className="card card-outline">
            <h3>Apoyo local</h3>
            <p>Colaboramos con negocios y productores locales para impulsar la economía de la zona.</p>
          </div>
          <div className="card card-outline">
            <h3>Voluntariado</h3>
            <p>Proyectos de limpieza de playas, parques y espacios naturales junto a nuestros equipos.</p>
          </div>
        </div>
      </section>

      <section id="compromisos" className="section section-compromisos">
        <h2>Nuestros compromisos</h2>
        <div className="stats">
          <div className="stat">
            <span className="stat-number">100%</span>
            <span className="stat-label">Envases reciclables</span>
          </div>
          <div className="stat">
            <span className="stat-number">3M+</span>
            <span className="stat-label">Personas beneficiadas por programas sociales</span>
          </div>
          <div className="stat">
            <span className="stat-number">2030</span>
            <span className="stat-label">Objetivo de emisiones netas cero</span>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2024 Coca-Cola Company. Juntos por un futuro más sostenible.</p>
      </footer>
    </div>
  );
}

