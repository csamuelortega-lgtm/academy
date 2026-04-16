import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from './auth';
import './mixes.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const flavorCatalog = {
  'coca-cola': ['Vainilla', 'Cereza', 'Lima', 'Canela'],
  fanta: ['Naranja intensa', 'Uva', 'Pina', 'Durazno'],
  sprite: ['Limon', 'Hierbabuena', 'Pepino', 'Jengibre'],
};

const drinkLabels = {
  'coca-cola': 'Coca-Cola',
  fanta: 'Fanta',
  sprite: 'Sprite',
};

const createEmptyRow = () => ({
  drink: 'coca-cola',
  flavor: flavorCatalog['coca-cola'][0],
  ml: 150,
});

const sortByRecent = (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);

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
  const [rows, setRows] = useState([createEmptyRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const totalMl = useMemo(() => rows.reduce((acc, item) => acc + (Number(item.ml) || 0), 0), [rows]);

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

  useEffect(() => {
    loadMixes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const resetForm = () => {
    setSelectedId(null);
    setRecipeName('');
    setNotes('');
    setRows([createEmptyRow()]);
    setInfo('Formulario reiniciado para una nueva mezcla.');
    setError('');
  };

  const loadMixIntoForm = (mix) => {
    setSelectedId(mix.id);
    setRecipeName(mix.recipeName || '');
    setNotes(mix.notes || '');
    setRows(Array.isArray(mix.drinks) && mix.drinks.length > 0 ? mix.drinks : [createEmptyRow()]);
    setInfo(`Editando mezcla: ${mix.recipeName}`);
    setError('');
  };

  const updateRow = (index, key, value) => {
    setRows((prevRows) => prevRows.map((row, rowIndex) => {
      if (rowIndex !== index) {
        return row;
      }

      if (key === 'drink') {
        const nextDrink = value;
        const nextFlavor = flavorCatalog[nextDrink][0];
        return {
          ...row,
          drink: nextDrink,
          flavor: nextFlavor,
        };
      }

      return {
        ...row,
        [key]: key === 'ml' ? Number(value) : value,
      };
    }));
  };

  const addRow = () => {
    setRows((prevRows) => [...prevRows, createEmptyRow()]);
  };

  const removeRow = (index) => {
    setRows((prevRows) => {
      if (prevRows.length === 1) {
        return prevRows;
      }

      return prevRows.filter((_, rowIndex) => rowIndex !== index);
    });
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
        drinks: rows,
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

            <div className="mixes-rows">
              {rows.map((row, index) => (
                <div className="mixes-row" key={`${row.drink}-${index}`}>
                  <select value={row.drink} onChange={(event) => updateRow(index, 'drink', event.target.value)}>
                    <option value="coca-cola">Coca-Cola</option>
                    <option value="fanta">Fanta</option>
                    <option value="sprite">Sprite</option>
                  </select>

                  <select value={row.flavor} onChange={(event) => updateRow(index, 'flavor', event.target.value)}>
                    {flavorCatalog[row.drink].map((flavorOption) => (
                      <option key={flavorOption} value={flavorOption}>{flavorOption}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={row.ml}
                    onChange={(event) => updateRow(index, 'ml', event.target.value)}
                  />

                  <button type="button" onClick={() => removeRow(index)} disabled={rows.length === 1}>
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            <div className="mixes-actions-row">
              <button type="button" className="mixes-secondary-btn" onClick={addRow}>Agregar refresco</button>
              <span>Total: <strong>{totalMl} ml</strong></span>
            </div>

            {error ? <div className="mixes-alert mixes-alert-error">{error}</div> : null}
            {info ? <div className="mixes-alert mixes-alert-info">{info}</div> : null}

            <button type="submit" className="mixes-primary-btn" disabled={saving}>
              {saving ? 'Guardando...' : (selectedId ? 'Actualizar mezcla' : 'Guardar mezcla')}
            </button>
          </form>
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
                <p className="mix-item-meta">{mix.totalMl || 0} ml · Actualizada: {mix.updatedAt ? new Date(mix.updatedAt).toLocaleString() : 'sin fecha'}</p>
                <ul>
                  {(mix.drinks || []).map((item, index) => (
                    <li key={`${mix.id}-${index}`}>
                      <strong>{drinkLabels[item.drink] || item.drink}</strong>
                      <span>{item.flavor}</span>
                      <em>{item.ml} ml</em>
                    </li>
                  ))}
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
