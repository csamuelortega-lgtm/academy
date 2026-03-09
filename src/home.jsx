import React from 'react';
import './home.css';

export default function Home() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="header">
        <div className="logo">Coca-Cola</div>
        <nav className="nav">
          <a href="#productos">Productos</a>
          <a href="#historia">Historia</a>
          <a href="#contacto">Contacto</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Taste the Feeling</h1>
          <p>Disfruta del refresco más icónico del mundo</p>
          <button className="btn-primary">Descubre Más</button>
        </div>
      </section>

      {/* Productos */}
      <section id="productos" className="productos">
        <h2>Nuestros Productos</h2>
        <div className="productos-grid">
          <div className="producto-card">
            <h3>Coca-Cola Classic</h3>
            <p>El sabor original desde 1886</p>
          </div>
          <div className="producto-card">
            <h3>Coca-Cola Zero</h3>
            <p>Mismo sabor, cero calorías</p>
          </div>
          <div className="producto-card">
            <h3>Coca-Cola Light</h3>
            <p>Refrescante y ligero</p>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section id="historia" className="historia">
        <h2>Nuestra Historia</h2>
        <p>Desde 1886, Coca-Cola ha sido parte de momentos especiales alrededor del mundo.</p>
      </section>

      {/* Footer */}
      <footer id="contacto" className="footer">
        <p>&copy; 2024 Coca-Cola Company. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}