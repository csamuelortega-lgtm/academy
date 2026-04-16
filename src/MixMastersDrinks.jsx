import React, { useState } from 'react';
import { useAuth } from './auth';

export default function MixMastersDrinks() {
  const [authTab, setAuthTab] = useState('login');
  const [menuOpen, setMenuOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, isAuthenticated, loading, login, logout } = useAuth();

  const displayName = user?.name || user?.username || user?.email || 'Usuario';
  const userRole = user?.role || 'usuario';

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login({ identifier, password });
      setIdentifier('');
      setPassword('');
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const BrandLogo = ({ size = 'md' }) => (
    <span
      className={[
        'font-extrabold tracking-tight select-none',
        size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl',
      ].join(' ')}
      aria-label="MixMastersDrinks"
    >
      <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
        MixMasters
      </span>
      <span className="bg-gradient-to-r from-lime-400 via-green-500 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
        Drinks
      </span>
    </span>
  );

  return (
    <div className="font-sans bg-zinc-950 text-white min-h-screen">

      {/* ───────────────────────────── NAVBAR ───────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/70 backdrop-blur border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-3xl" aria-hidden>🥤</span>
            <BrandLogo />
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-300">
            <a href="#como-funciona" className="hover:text-orange-400 transition-colors">Cómo funciona</a>
            <a href="#beneficios" className="hover:text-lime-400 transition-colors">Beneficios</a>
            <a href="#auth" className="hover:text-emerald-400 transition-colors">{isAuthenticated ? 'Mi espacio' : 'Acceder'}</a>
          </nav>

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-zinc-200 to-zinc-400 text-zinc-950 text-sm font-extrabold px-5 py-2 rounded-full hover:brightness-110 transition-all shadow-lg shadow-black/20"
            >
              Cerrar sesión
            </button>
          ) : (
            <a
              href="#auth"
              className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 via-red-500 to-lime-500 text-zinc-950 text-sm font-extrabold px-5 py-2 rounded-full hover:brightness-110 transition-all shadow-lg shadow-black/20"
            >
              Empieza gratis
            </a>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden text-zinc-300 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav className="md:hidden px-6 pb-4 flex flex-col gap-4 text-sm text-zinc-300 border-t border-zinc-800">
            <a href="#como-funciona" onClick={() => setMenuOpen(false)} className="hover:text-orange-400">Cómo funciona</a>
            <a href="#beneficios" onClick={() => setMenuOpen(false)} className="hover:text-lime-400">Beneficios</a>
            <a href="#auth" onClick={() => setMenuOpen(false)} className="hover:text-emerald-400">{isAuthenticated ? 'Mi espacio' : 'Acceder'}</a>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="bg-gradient-to-r from-zinc-200 to-zinc-400 text-zinc-950 font-extrabold px-4 py-2 rounded-full text-center hover:brightness-110 transition-all"
              >
                Cerrar sesión
              </button>
            ) : (
              <a
                href="#auth"
                onClick={() => setMenuOpen(false)}
                className="bg-gradient-to-r from-orange-500 via-red-500 to-lime-500 text-zinc-950 font-extrabold px-4 py-2 rounded-full text-center hover:brightness-110 transition-all"
              >
                Empieza gratis
              </a>
            )}
          </nav>
        )}
      </header>

      {/* ────────────────────────────── HERO ────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Decorative “mezcla” blobs (inspirado en la referencia) */}
        <div className="absolute -top-16 -left-24 w-[34rem] h-[34rem] bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-16 left-1/3 w-[28rem] h-[28rem] bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-0 w-[32rem] h-[32rem] bg-lime-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-20 w-56 h-56 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-zinc-200 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-lime-500" aria-hidden />
              Mezcla refrescos. Crea bebidas.
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              <span className="block">Tu próxima bebida</span>
              <span className="block">
                empieza con una <span className="bg-gradient-to-r from-orange-500 via-red-500 to-lime-400 bg-clip-text text-transparent">mezcla</span>
              </span>
            </h1>
            <p className="text-zinc-300/90 text-lg leading-relaxed mb-8 max-w-xl">
              MixMastersDrinks te ayuda a combinar refrescos existentes, ajustar proporciones y guardar tus recetas favoritas para repetirlas (o mejorarlas) cuando quieras.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#auth" className="bg-gradient-to-r from-orange-500 via-red-500 to-lime-500 text-zinc-950 font-extrabold px-8 py-3 rounded-full hover:brightness-110 transition-all shadow-lg shadow-black/20">
                Empieza gratis
              </a>
              <a href="#como-funciona" className="border border-white/15 bg-white/5 text-zinc-200 font-semibold px-8 py-3 rounded-full hover:border-orange-400/60 hover:text-white transition-all">
                Ver cómo funciona
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-6 text-sm text-zinc-300/80">
              <div>
                <span className="block text-2xl font-bold text-white">12k+</span>
                Mixólogos activos
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <span className="block text-2xl font-bold text-white">3.5k+</span>
                Recetas publicadas
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <span className="block text-2xl font-bold text-white">4.9★</span>
                Valoración media
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="flex justify-center">
            <div className="relative w-72 h-72 md:w-96 md:h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-lime-500 rounded-3xl opacity-25 blur-xl" />
              <div className="relative bg-zinc-950/50 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 h-full backdrop-blur">
                <span className="text-8xl" aria-hidden>🥤</span>
                <p className="text-center text-zinc-100 font-semibold text-lg">Mezcla “Cítrica”</p>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 via-red-500 to-lime-500 h-2 rounded-full" style={{ width: '78%' }} />
                </div>
                <p className="text-xs text-zinc-300/60">Equilibrio de sabor: 78%</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {['Cola', 'Naranja', 'Lima', 'Hielo'].map(tag => (
                    <span key={tag} className="bg-white/5 text-zinc-200/80 text-xs px-3 py-1 rounded-full border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────── CÓMO FUNCIONA ────────────────────────── */}
      <section id="como-funciona" className="py-24 px-6 bg-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-zinc-200 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-lime-500" aria-hidden />
              El proceso
            </span>
            <h2 className="text-4xl font-extrabold mb-4">¿Cómo funciona?</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              En cuatro pasos sencillos, pasas de “tengo refrescos” a “tengo una receta”.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '🥤', title: 'Elige tus refrescos', desc: 'Selecciona los refrescos que tienes a mano. Nosotros te mostramos combinaciones compatibles.' },
              { step: '02', icon: '🧪', title: 'Ajusta proporciones', desc: 'Desliza porcentajes y consigue el equilibrio: dulce, ácido, gas y amargor.' },
              { step: '03', icon: '🧊', title: 'Añade extras', desc: 'Hielo, cítricos, siropes o toppings. Guarda variaciones sin perder la receta original.' },
              { step: '04', icon: '⭐', title: 'Guarda y comparte', desc: 'Nombra tu mezcla, crea tu colección y comparte un link con tu “fórmula” favorita.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="relative bg-zinc-800/60 border border-white/10 rounded-2xl p-6 hover:border-orange-400/60 transition-colors group">
                <span className="text-5xl font-black text-zinc-700 group-hover:text-zinc-600 transition-colors absolute top-4 right-4 leading-none">
                  {step}
                </span>
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────── BENEFICIOS ──────────────────────────── */}
      <section id="beneficios" className="py-24 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-zinc-200 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-lime-500" aria-hidden />
              Ventajas
            </span>
            <h2 className="text-4xl font-extrabold mb-4">¿Por qué MixMastersDrinks?</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Diseñado para mezclar refrescos reales, con un flujo simple y una estética “splash”.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🤖',
                title: 'Inteligencia Artificial',
                desc: 'Nuestro motor de IA analiza tus gustos y sugiere recetas personalizadas que evolucionan contigo.',
                highlight: true,
              },
              {
                icon: '📚',
                title: 'Biblioteca ilimitada',
                desc: 'Accede a más de 3.500 recetas verificadas por bartenders profesionales de todo el mundo.',
                highlight: false,
              },
              {
                icon: '👥',
                title: 'Comunidad activa',
                desc: 'Conecta con 12.000+ mixólogos, comparte creaciones y participa en retos semanales.',
                highlight: false,
              },
              {
                icon: '🎓',
                title: 'Cursos y guías',
                desc: 'Desde técnicas básicas hasta maridajes avanzados. Aprende a tu ritmo con tutoriales en vídeo.',
                highlight: false,
              },
              {
                icon: '📊',
                title: 'Gestión de inventario',
                desc: 'Registra tus botellas, recibe alertas de stock y descubre qué recetas puedes preparar ahora mismo.',
                highlight: false,
              },
              {
                icon: '🎯',
                title: 'Retos y logros',
                desc: 'Gamificación que te mantiene motivado. Gana insignias, sube de nivel y demuestra tu talento.',
                highlight: false,
              },
            ].map(({ icon, title, desc, highlight }) => (
              <div
                key={title}
                className={`rounded-2xl p-6 border transition-all hover:-translate-y-1 ${
                  highlight
                    ? 'bg-gradient-to-br from-orange-500 via-red-500 to-lime-500 border-transparent text-zinc-950'
                    : 'bg-zinc-900/60 border-white/10 hover:border-lime-400/60'
                }`}
              >
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className={`text-lg font-bold mb-2 ${highlight ? 'text-zinc-950' : 'text-white'}`}>{title}</h3>
                <p className={`text-sm leading-relaxed ${highlight ? 'text-zinc-800' : 'text-zinc-400'}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── CALL TO ACTION ────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-br from-orange-500 via-red-500 to-lime-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Convierte mezclas en recetas repetibles
          </h2>
          <p className="text-white text-opacity-90 text-lg mb-10 leading-relaxed">
            Prueba MixMastersDrinks para crear tus combinaciones, guardarlas en tu colección y compartirlas con tu gente. 14 días gratis, sin tarjeta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#auth"
              className="bg-zinc-950 text-white font-bold px-10 py-4 rounded-full hover:bg-zinc-800 transition-colors text-lg"
            >
              Crear cuenta gratis
            </a>
            <a
              href="#como-funciona"
              className="bg-white bg-opacity-20 text-white border border-white border-opacity-40 font-semibold px-10 py-4 rounded-full hover:bg-opacity-30 transition-colors text-lg"
            >
              Ver el flujo
            </a>
          </div>
          <p className="text-white text-opacity-60 text-sm mt-6">
            ✓ Sin compromiso &nbsp;·&nbsp; ✓ Cancela cuando quieras &nbsp;·&nbsp; ✓ Soporte 24/7
          </p>
        </div>
      </section>

      {/* ─────────────────────────── LOGIN / USER SPACE ─────────────────────── */}
      <section id="auth" className="py-24 px-6 bg-zinc-900">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <span className="text-4xl" aria-hidden>🥤</span>
            <div className="mt-2 mb-1 flex items-center justify-center">
              <BrandLogo size="lg" />
            </div>
            <p className="text-zinc-400 text-sm">{isAuthenticated ? 'Tu sesión está activa' : 'Tu plataforma de mixología'}</p>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-8">
            {loading ? (
              <div className="text-center text-zinc-300 py-6">Comprobando sesión...</div>
            ) : isAuthenticated ? (
              <div className="flex flex-col gap-4 text-zinc-200">
                <div className="rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-3">
                  <p className="text-sm text-zinc-400">Usuario conectado</p>
                  <p className="font-semibold text-white">{displayName}</p>
                </div>
                <div className="rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-3">
                  <p className="text-sm text-zinc-400">Rol</p>
                  <p className="font-semibold text-white">{userRole}</p>
                </div>
                <div className="rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-3">
                  <p className="text-sm text-zinc-400">Base de datos</p>
                  <p className="font-semibold text-white">{user?.database || 'clientes'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full bg-gradient-to-r from-zinc-200 to-zinc-400 text-zinc-950 font-extrabold py-3 rounded-xl hover:brightness-110 transition-all"
                >
                  Cerrar sesión
                </button>
                <a
                  href="/mixes"
                  className="w-full text-center border border-zinc-500 text-zinc-100 font-semibold py-3 rounded-xl hover:border-zinc-300 transition-all"
                >
                  Ir al editor de mezclas
                </a>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Correo o usuario</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="usuario@correo.com"
                    className="w-full bg-zinc-900 border border-zinc-600 text-white rounded-xl px-4 py-3 text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-400 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900 border border-zinc-600 text-white rounded-xl px-4 py-3 text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-400 transition-colors"
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-lime-500 text-zinc-950 font-extrabold py-3 rounded-xl hover:brightness-110 transition-all"
                >
                  {submitting ? 'Entrando...' : 'Iniciar sesión'}
                </button>

                <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setAuthTab('login')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      authTab === 'login'
                        ? 'bg-gradient-to-r from-orange-500 via-red-500 to-lime-500 text-zinc-950 font-extrabold'
                        : 'text-zinc-400'
                    }`}
                  >
                    Login activo
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab('register')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      authTab === 'register'
                        ? 'bg-gradient-to-r from-orange-500 via-red-500 to-lime-500 text-zinc-950 font-extrabold'
                        : 'text-zinc-400'
                    }`}
                  >
                    Sin registro
                  </button>
                </div>
                {authTab === 'register' ? (
                  <p className="text-sm text-zinc-400 text-center">
                    En este flujo solo se habilito login con CouchDB sobre la base <strong className="text-zinc-200">clientes</strong>.
                  </p>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────── FOOTER ─────────────────────────────── */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>🥤</span>
            <BrandLogo size="sm" />
          </div>
          <p className="text-zinc-500 text-sm">© 2026 MixMastersDrinks. Todos los derechos reservados.</p>
          <div className="flex gap-6 text-zinc-500 text-sm">
            <a href="#" className="hover:text-orange-400 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-lime-400 transition-colors">Términos</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Contacto</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
