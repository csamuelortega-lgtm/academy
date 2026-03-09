import React from 'react';
import './home.css';

export default function HomeExperiencias() {
  return (
    <div className="landing">
      <header className="header">
        <div className="logo">Coca-Cola</div>
        <nav className="nav">
          <a href="#eventos">Eventos</a>
          <a href="#musica">Música</a>
          <a href="#momentos">Momentos</a>
        </nav>
      </header>

      <section className="hero hero-experiencias">
        <div className="hero-content">
          <h1>Comparte la magia</h1>
          <p>Festivales, conciertos y momentos únicos con el sabor de Coca-Cola.</p>
          <button className="btn-primary btn-primary-dark">Descubre las experiencias</button>
        </div>
      </section>

      <section id="eventos" className="section section-eventos">
        <h2>Eventos que se viven</h2>
        <div className="grid-3">
          <div className="card card-glow">
            <h3>Festivales de música</h3>
            <p>Presencia en los principales festivales, llevando refresco, música y experiencias interactivas.</p>
          </div>
          <div className="card card-glow">
            <h3>Deporte y emoción</h3>
            <p>Apoyamos competiciones deportivas para que cada celebración se viva con más intensidad.</p>
          </div>
          <div className="card card-glow">
            <h3>Activaciones urbanas</h3>
            <p>Instalaciones pop-up, sampling y espacios para que la ciudad disfrute Coca-Cola.</p>
          </div>
        </div>
      </section>

      <section id="musica" className="section section-musica">
        <h2>La banda sonora de tus momentos</h2>
        <div className="timeline">
          <div className="timeline-item">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <h3>Playlist oficiales</h3>
              <p>Crea el ambiente perfecto con playlists curadas por Coca-Cola en tus plataformas favoritas.</p>
            </div>
          </div>
          <div className="timeline-item">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <h3>Artistas emergentes</h3>
              <p>Espacios para descubrir nuevos talentos y apoyar la escena local.</p>
            </div>
          </div>
          <div className="timeline-item">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <h3>Experiencias inmersivas</h3>
              <p>Activaciones donde la música, la luz y el sabor se mezclan en una sola experiencia.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="momentos" className="section section-momentos">
        <h2>Tus momentos Coca-Cola</h2>
        <p className="center-text">
          Desde una comida en familia hasta un gran concierto, cada momento sabe mejor cuando se comparte.
        </p>
        <div className="grid-3">
          <div className="pill">#ComparteUnaCocaCola</div>
          <div className="pill">#TasteTheFeeling</div>
          <div className="pill">#RealMagic</div>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2024 Coca-Cola Company. Momentos que se disfrutan mejor juntos.</p>
      </footer>
    </div>
  );
}

