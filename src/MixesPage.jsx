import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';

import { useAuth } from './auth';
import './mixes.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const flavorCatalog = {
  cocacola: ['Vainilla', 'Cereza', 'Lima', 'Canela'],
  fanta: ['Naranja intensa', 'Uva', 'Pina', 'Durazno'],
  sprite: ['Limon', 'Hierbabuena', 'Pepino', 'Jengibre'],
};

const drinkLabels = {
  cocacola: 'Coca-Cola',
  fanta: 'Fanta',
  sprite: 'Sprite',
};

const sortByRecent = (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);

const drinkKeys = ['cocacola', 'fanta', 'sprite'];

const clampPercentage = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const rebalancePercentages = (current, changedKey, changedValue) => {
  const nextValue = clampPercentage(changedValue);
  const otherKeys = drinkKeys.filter((key) => key !== changedKey);
  const remaining = 100 - nextValue;

  const currentOtherTotal = otherKeys.reduce((acc, key) => acc + Number(current[key] || 0), 0);

  let firstOtherValue;
  if (currentOtherTotal === 0) {
    firstOtherValue = Math.round(remaining / 2);
  } else {
    firstOtherValue = Math.round((remaining * Number(current[otherKeys[0]] || 0)) / currentOtherTotal);
  }

  const secondOtherValue = remaining - firstOtherValue;

  return {
    ...current,
    [changedKey]: nextValue,
    [otherKeys[0]]: firstOtherValue,
    [otherKeys[1]]: secondOtherValue,
  };
};

const requestJson = async (path, options = {}, token) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) {
    throw new Error(payload?.message || payload || 'No se pudo completar la operación');
  }

  return payload;
};

export default function MixesPage() {
  const { session, user, logout } = useAuth();
  const [mixes, setMixes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [recipeName, setRecipeName] = useState('');
  const [notes, setNotes] = useState('');
  const [percentages, setPercentages] = useState({ cocacola: 34, fanta: 33, sprite: 33 });
  const [flavors, setFlavors] = useState({
    cocacola: flavorCatalog.cocacola[0],
    fanta: flavorCatalog.fanta[0],
    sprite: flavorCatalog.sprite[0],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [qrOpen, setQrOpen] = useState(false);

  const totalPercentage = useMemo(() => (
    Number(percentages.cocacola || 0)
    + Number(percentages.fanta || 0)
    + Number(percentages.sprite || 0)
  ), [percentages]);

  useEffect(() => {
    const loadMixes = async () => {
      if (!session?.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const payload = await requestJson('/api/mixes', { method: 'GET' }, session.token);
        setMixes((payload.mixes || []).sort(sortByRecent));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadMixes();
  }, [session?.token]);

  const resetForm = () => {
    setSelectedId(null);
    setRecipeName('');
    setNotes('');
    setPercentages({ cocacola: 34, fanta: 33, sprite: 33 });
    setFlavors({
      cocacola: flavorCatalog.cocacola[0],
      fanta: flavorCatalog.fanta[0],
      sprite: flavorCatalog.sprite[0],
    });
    setQrImage('');
    setQrOpen(false);
    setInfo('Formulario reiniciado para una nueva mezcla.');
    setError('');
  };

  const loadMixIntoForm = (mix) => {
    setSelectedId(mix.id);
    setRecipeName(mix.recipeName || '');
    setNotes(mix.notes || '');
    setPercentages({
      cocacola: Number(mix.percentages?.cocacola || 0),
      fanta: Number(mix.percentages?.fanta || 0),
      sprite: Number(mix.percentages?.sprite || 0),
    });
    setFlavors({
      cocacola: mix.flavors?.cocacola || flavorCatalog.cocacola[0],
      fanta: mix.flavors?.fanta || flavorCatalog.fanta[0],
      sprite: mix.flavors?.sprite || flavorCatalog.sprite[0],
    });
    setQrImage('');
    setQrOpen(false);
    setInfo(`Editando mezcla: ${mix.recipeName}`);
    setError('');
  };

  const updatePercentage = (drinkKey, value) => {
    setPercentages((prevPercentages) => rebalancePercentages(prevPercentages, drinkKey, value));
  };

  const updateFlavor = (drinkKey, value) => {
    setFlavors((prevFlavors) => ({
      ...prevFlavors,
      [drinkKey]: value,
    }));
  };

  const buildQrPayload = () => ({
    type: 'mezcla_bebida',
    userId: user?.id || user?.email || user?.username || 'anonimo',
    userEmail: user?.email || '',
    recipeName: recipeName || 'Mezcla sin nombre',
    percentages,
    flavors,
    generatedAt: new Date().toISOString(),
  });

  const handleShowQr = async () => {
    setError('');
    setInfo('');

    try {
      if (totalPercentage !== 100) {
        throw new Error('Los sliders deben sumar exactamente 100% para generar el QR');
      }

      const qrPayload = buildQrPayload();
      const qrText = JSON.stringify(qrPayload);
      const qrDataUrl = await QRCode.toDataURL(qrText, {
        width: 360,
        margin: 2,
        errorCorrectionLevel: 'M',
      });

      setQrImage(qrDataUrl);
      setQrOpen(true);
      setInfo('QR generado con los datos de mezcla y el identificador de usuario.');
    } catch (qrError) {
      setError(qrError.message || 'No se pudo generar el QR');
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!session?.token) {
      setError('No hay sesión activa');
      return;
    }

    setSaving(true);
    setError('');
    setInfo('');

    try {
      const selectedMix = mixes.find((item) => item.id === selectedId);
      const payload = {
        recipeName,
        notes,
        percentages,
        flavors,
      };

      if (selectedMix) {
        payload.rev = selectedMix.rev;
      }

      const response = selectedMix
        ? await requestJson(`/api/mixes/${selectedMix.id}`, { method: 'PUT', body: JSON.stringify(payload) }, session.token)
        : await requestJson('/api/mixes', { method: 'POST', body: JSON.stringify(payload) }, session.token);

      const savedMix = response.mix;

      setMixes((prevMixes) => {
        const withoutSaved = prevMixes.filter((item) => item.id !== savedMix.id);
        return [savedMix, ...withoutSaved].sort(sortByRecent);
      });

      setSelectedId(savedMix.id);
      setInfo(selectedMix ? 'Mezcla actualizada correctamente.' : 'Mezcla guardada correctamente.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.name || user?.email || 'Usuario';

  return (
    <div className="mixes-page">
      <header className="mixes-header">
        <div>
          <p className="mixes-kicker">Laboratorio de mezclas</p>
          <h1>Editor de refrescos y saborizantes</h1>
          <p className="mixes-subtitle">
            Crea, visualiza y guarda combinaciones de Coca-Cola, Fanta y Sprite con sus saborizantes.
          </p>
        </div>
        <div className="mixes-header-actions">
          <span className="mixes-user">Sesion: {displayName}</span>
          <Link to="/mixmastersdrinks" className="mixes-secondary-btn">Volver</Link>
          <button type="button" className="mixes-secondary-btn" onClick={logout}>Cerrar sesion</button>
        </div>
      </header>

      <main className="mixes-layout">
        <section className="mixes-card mixes-form-card">
          <div className="mixes-form-head">
            <h2>{selectedId ? 'Editar mezcla' : 'Nueva mezcla'}</h2>
            <button type="button" className="mixes-secondary-btn" onClick={resetForm}>Nueva</button>
          </div>

          <form onSubmit={handleSave} className="mixes-form">
            <label>
              Nombre de la mezcla
              <input
                value={recipeName}
                onChange={(event) => setRecipeName(event.target.value)}
                placeholder="Ej. Fiesta citrica"
                required
              />
            </label>

            <label>
              Notas
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Describe sabor, momento ideal o ajustes."
                rows={3}
              />
            </label>

            <div className="mixes-sliders">
              {drinkKeys.map((drinkKey) => (
                <div className="mix-slider" key={drinkKey}>
                  <div className="mix-slider-head">
                    <strong>{drinkLabels[drinkKey]}</strong>
                    <span>{percentages[drinkKey]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={percentages[drinkKey]}
                    onChange={(event) => updatePercentage(drinkKey, event.target.value)}
                  />
                  <label>
                    Sabor extra
                    <select value={flavors[drinkKey]} onChange={(event) => updateFlavor(drinkKey, event.target.value)}>
                      {flavorCatalog[drinkKey].map((flavorOption) => (
                        <option key={flavorOption} value={flavorOption}>{flavorOption}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>

            <div className="mixes-actions-row">
              <span>Total mezcla: <strong>{totalPercentage}%</strong></span>
              <button type="button" className="mixes-secondary-btn" onClick={handleShowQr}>Mostrar QR</button>
            </div>

            {error ? <div className="mixes-alert mixes-alert-error">{error}</div> : null}
            {info ? <div className="mixes-alert mixes-alert-info">{info}</div> : null}

            <button type="submit" className="mixes-primary-btn" disabled={saving}>
              {saving ? 'Guardando...' : (selectedId ? 'Actualizar mezcla' : 'Guardar mezcla')}
            </button>
          </form>

          {qrOpen && qrImage ? (
            <div className="mixes-qr-box">
              <h3>QR de mezcla</h3>
              <img src={qrImage} alt="QR de mezcla" />
              <p>
                Incluye usuario ({user?.id || user?.email || 'sin-id'}), porcentajes y saborizantes para lectura de maquina.
              </p>
            </div>
          ) : null}
        </section>

        <section className="mixes-card mixes-list-card">
          <h2>Mezclas guardadas</h2>

          {loading ? <p className="mixes-muted">Cargando mezclas...</p> : null}

          {!loading && mixes.length === 0 ? (
            <p className="mixes-muted">Aun no tienes mezclas guardadas.</p>
          ) : null}

          <div className="mixes-list">
            {mixes.map((mix) => (
              <article className="mix-item" key={mix.id}>
                <div className="mix-item-head">
                  <h3>{mix.recipeName}</h3>
                  <button type="button" onClick={() => loadMixIntoForm(mix)}>Editar</button>
                </div>
                <p className="mix-item-meta">{mix.totalPercentage || 0}% · Actualizada: {mix.updatedAt ? new Date(mix.updatedAt).toLocaleString() : 'sin fecha'}</p>
                <ul>
                  <li>
                    <strong>Coca-Cola</strong>
                    <span>{mix.flavors?.cocacola || '-'}</span>
                    <em>{mix.percentages?.cocacola || 0}%</em>
                  </li>
                  <li>
                    <strong>Fanta</strong>
                    <span>{mix.flavors?.fanta || '-'}</span>
                    <em>{mix.percentages?.fanta || 0}%</em>
                  </li>
                  <li>
                    <strong>Sprite</strong>
                    <span>{mix.flavors?.sprite || '-'}</span>
                    <em>{mix.percentages?.sprite || 0}%</em>
                  </li>
                </ul>
                {mix.notes ? <p className="mix-item-notes">{mix.notes}</p> : null}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
