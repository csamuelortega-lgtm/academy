// server.js

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = 3002;

app.use(cors());



// Middleware para habilitar el manejo de JSON y datos de formulario
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionStore = new Map();

const getCouchDbBaseUrl = () => (process.env.COUCHDB_URL || 'http://127.0.0.1:5984').replace(/\/$/, '');
const getUsersDbName = () => process.env.COUCHDB_USERS_DB || process.env.COUCHDB_DB || process.env.COUCHDB_DATABASE || 'clientes';
const getMixesDbName = () => process.env.COUCHDB_MIXES_DB || 'mixes';
const getCouchDbAuthHeader = () => {
  const username = process.env.COUCHDB_USERNAME || process.env.COUCHDB_USER;
  const password = process.env.COUCHDB_PASSWORD || process.env.COUCHDB_PASS;

  if (!username || !password) {
    return {};
  }

  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
  };
};

const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase();

const pickPassword = (document) => (
  document.password
  || document.pass
  || document.clave
  || document.contrasena
  || document['contraseña']
  || ''
);

const sanitizeUser = (document) => ({
  id: document._id || document.id || null,
  name: document.name || document.fullName || document.nombre || '',
  email: document.email || document.mail || '',
  login: document.login || document.username || document.usuario || '',
  username: document.username || document.usuario || '',
  role: document.role || document.rol || document.type || 'usuario',
  database: getUsersDbName(),
});

async function findUserDocument(identifier) {
  const rawIdentifier = String(identifier || '').trim();
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const databaseUrl = getCouchDbBaseUrl();
  const databaseName = getUsersDbName();

  const response = await fetch(`${databaseUrl}/${encodeURIComponent(databaseName)}/_find`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCouchDbAuthHeader(),
    },
    body: JSON.stringify({
      selector: {
        $or: [
          { login: { $in: [rawIdentifier, normalizedIdentifier] } },
          { email: { $in: [rawIdentifier, normalizedIdentifier] } },
          { mail: { $in: [rawIdentifier, normalizedIdentifier] } },
          { username: { $in: [rawIdentifier, normalizedIdentifier] } },
          { usuario: { $in: [rawIdentifier, normalizedIdentifier] } },
        ],
      },
      limit: 1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'No se pudo consultar CouchDB');
  }

  const result = await response.json();
  return result.docs?.[0] || null;
}

function getBearerToken(request) {
  const authorization = request.headers.authorization || '';

  if (authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }

  return null;
}

function requireSession(request, response, next) {
  const token = getBearerToken(request);

  if (!token || !sessionStore.has(token)) {
    response.status(401).json({ message: 'Sesión no encontrada' });
    return;
  }

  request.session = sessionStore.get(token);
  request.sessionToken = token;
  next();
}

const getSessionOwnerKey = (request) => (
  request.session?.user?.id
  || request.session?.user?.email
  || request.session?.user?.username
  || null
);

const sanitizeMix = (document) => ({
  id: document._id,
  rev: document._rev,
  collection: document.collection || 'mixes',
  recipeName: document.recipeName || '',
  notes: document.notes || '',
  percentages: {
    cocacola: Number(document.percentages?.cocacola || 0),
    fanta: Number(document.percentages?.fanta || 0),
    sprite: Number(document.percentages?.sprite || 0),
  },
  flavors: {
    cocacola: document.flavors?.cocacola || '',
    fanta: document.flavors?.fanta || '',
    sprite: document.flavors?.sprite || '',
  },
  totalPercentage: Number(document.totalPercentage || 0),
  createdAt: document.createdAt || null,
  updatedAt: document.updatedAt || null,
});

const flavorCatalog = {
  cocacola: ['Vainilla', 'Cereza', 'Lima', 'Canela'],
  fanta: ['Naranja intensa', 'Uva', 'Pina', 'Durazno'],
  sprite: ['Limon', 'Hierbabuena', 'Pepino', 'Jengibre'],
};

const normalizePercentages = (percentages) => {
  const cocacola = Number(percentages?.cocacola);
  const fanta = Number(percentages?.fanta);
  const sprite = Number(percentages?.sprite);

  const values = { cocacola, fanta, sprite };

  Object.entries(values).forEach(([key, value]) => {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`Porcentaje invalido para ${key}`);
    }
  });

  const total = cocacola + fanta + sprite;
  if (Math.abs(total - 100) > 0.0001) {
    throw new Error('La suma de Coca-Cola, Fanta y Sprite debe ser 100%');
  }

  return {
    cocacola: Math.round(cocacola * 100) / 100,
    fanta: Math.round(fanta * 100) / 100,
    sprite: Math.round(sprite * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

const normalizeFlavors = (flavors) => {
  const normalized = {
    cocacola: String(flavors?.cocacola || '').trim(),
    fanta: String(flavors?.fanta || '').trim(),
    sprite: String(flavors?.sprite || '').trim(),
  };

  Object.keys(flavorCatalog).forEach((drinkKey) => {
    if (!flavorCatalog[drinkKey].includes(normalized[drinkKey])) {
      throw new Error(`Saborizante no permitido para ${drinkKey}`);
    }
  });

  return normalized;
};

async function couchDbRequest(databaseName, endpoint, options = {}) {
  const response = await fetch(`${getCouchDbBaseUrl()}/${encodeURI(databaseName)}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getCouchDbAuthHeader(),
      ...(options.headers || {}),
    },
  });

  const bodyText = await response.text();
  const parsedBody = bodyText ? JSON.parse(bodyText) : null;

  if (!response.ok) {
    throw new Error(parsedBody?.reason || parsedBody?.error || bodyText || 'Error de CouchDB');
  }

  return parsedBody;
}




// Controlador para leer el contenido del archivo
app.post('/api/test/', async (req, res) => {
    try {
        const { jsx, css, js } = req.body;

        const jsxContent = await readFileContent(jsx);
        const cssContent = await readFileContent(css);
        const jsContent = await readFileContent(js);
    
        const result = {
          jsx: jsxContent,
          css: cssContent,
          js: jsContent,
        };
    
        res.status(200).json(result);
      } catch (error) {
        console.error('Error al leer los archivos:', error);
        res.status(500).send('Error interno del servidor');
      }
});

    app.post('/api/auth/login', async (req, res) => {
      try {
        const { identifier, password } = req.body || {};

        if (!identifier || !password) {
          res.status(400).json({ message: 'Faltan credenciales' });
          return;
        }

        const userDocument = await findUserDocument(identifier);

        if (!userDocument) {
          res.status(401).json({ message: 'Usuario no encontrado' });
          return;
        }

        const storedPassword = String(pickPassword(userDocument));

        if (!storedPassword || storedPassword !== String(password)) {
          res.status(401).json({ message: 'Credenciales inválidas' });
          return;
        }

        const token = crypto.randomUUID();
        const user = sanitizeUser(userDocument);

        sessionStore.set(token, {
          user,
          createdAt: new Date().toISOString(),
        });

        res.status(200).json({ token, user });
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: `No se pudo iniciar sesión: ${error.message || 'error desconocido'}` });
      }
    });

    app.get('/api/auth/me', requireSession, async (req, res) => {
      res.status(200).json({ user: req.session.user });
    });

    app.post('/api/auth/logout', requireSession, async (req, res) => {
      sessionStore.delete(req.sessionToken);
      res.status(200).json({ message: 'Sesión cerrada' });
    });

    app.get('/api/mixes', requireSession, async (req, res) => {
      try {
        const ownerKey = getSessionOwnerKey(req);

        if (!ownerKey) {
          res.status(400).json({ message: 'No se pudo identificar el usuario actual' });
          return;
        }

        const mixesDbName = getMixesDbName();
        const result = await couchDbRequest(mixesDbName, '/_find', {
          method: 'POST',
          body: JSON.stringify({
            selector: {
              type: 'mix',
              collection: 'mixes',
              ownerKey,
            },
            limit: 200,
          }),
        });

        const mixes = (result.docs || []).map(sanitizeMix);
        res.status(200).json({ mixes });
      } catch (error) {
        console.error('Error al listar mezclas:', error);
        res.status(500).json({ message: `No se pudieron cargar las mezclas: ${error.message}` });
      }
    });

    app.post('/api/mixes', requireSession, async (req, res) => {
      try {
        const ownerKey = getSessionOwnerKey(req);
        const recipeName = String(req.body?.recipeName || '').trim();
        const notes = String(req.body?.notes || '').trim();
        const percentages = normalizePercentages(req.body?.percentages);
        const flavors = normalizeFlavors(req.body?.flavors);

        if (!ownerKey) {
          res.status(400).json({ message: 'No se pudo identificar el usuario actual' });
          return;
        }

        if (!recipeName) {
          res.status(400).json({ message: 'El nombre de la mezcla es obligatorio' });
          return;
        }

        const now = new Date().toISOString();

        const payload = {
          type: 'mix',
          collection: 'mixes',
          ownerKey,
          ownerId: req.session?.user?.id || '',
          ownerEmail: req.session?.user?.email || '',
          recipeName,
          notes,
          percentages: {
            cocacola: percentages.cocacola,
            fanta: percentages.fanta,
            sprite: percentages.sprite,
          },
          flavors,
          totalPercentage: percentages.total,
          createdAt: now,
          updatedAt: now,
        };

        const mixesDbName = getMixesDbName();
        const createResult = await couchDbRequest(mixesDbName, '', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        res.status(201).json({
          mix: {
            ...sanitizeMix({
              _id: createResult.id,
              _rev: createResult.rev,
              ...payload,
            }),
          },
        });
      } catch (error) {
        console.error('Error al crear mezcla:', error);
        res.status(500).json({ message: `No se pudo guardar la mezcla: ${error.message}` });
      }
    });

    app.put('/api/mixes/:id', requireSession, async (req, res) => {
      try {
        const ownerKey = getSessionOwnerKey(req);
        const mixId = String(req.params.id || '').trim();
        const revision = String(req.body?.rev || '').trim();
        const recipeName = String(req.body?.recipeName || '').trim();
        const notes = String(req.body?.notes || '').trim();
        const percentages = normalizePercentages(req.body?.percentages);
        const flavors = normalizeFlavors(req.body?.flavors);

        if (!ownerKey) {
          res.status(400).json({ message: 'No se pudo identificar el usuario actual' });
          return;
        }

        if (!mixId || !revision) {
          res.status(400).json({ message: 'Faltan id o revision de la mezcla' });
          return;
        }

        if (!recipeName) {
          res.status(400).json({ message: 'El nombre de la mezcla es obligatorio' });
          return;
        }

        const mixesDbName = getMixesDbName();
        const existing = await couchDbRequest(mixesDbName, `/${encodeURIComponent(mixId)}`, { method: 'GET' });

        if (existing.type !== 'mix' || existing.collection !== 'mixes' || existing.ownerKey !== ownerKey) {
          res.status(403).json({ message: 'No tienes permisos para editar esta mezcla' });
          return;
        }

        if (existing._rev !== revision) {
          res.status(409).json({ message: 'La mezcla fue actualizada por otro proceso, recarga la lista' });
          return;
        }

        const nextPayload = {
          ...existing,
          recipeName,
          notes,
          percentages: {
            cocacola: percentages.cocacola,
            fanta: percentages.fanta,
            sprite: percentages.sprite,
          },
          flavors,
          totalPercentage: percentages.total,
          updatedAt: new Date().toISOString(),
        };

        const updateResult = await couchDbRequest(mixesDbName, `/${encodeURIComponent(mixId)}`, {
          method: 'PUT',
          body: JSON.stringify(nextPayload),
        });

        res.status(200).json({
          mix: sanitizeMix({
            ...nextPayload,
            _rev: updateResult.rev,
          }),
        });
      } catch (error) {
        console.error('Error al actualizar mezcla:', error);
        res.status(500).json({ message: `No se pudo actualizar la mezcla: ${error.message}` });
      }
    });

async function readFileContent(filePath) {
    try {
    // Ruta al archivo en el servidor
    const ini = './src/editor/test'

      const fullPath = path.resolve(__dirname, ini + filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Error al leer el archivo ${filePath}:`, error);
      return null;
    }
  }
  

// Controlador para modificar el contenido del archivo
app.put('/api/test', async (req, res) => {
    try {
      const { paths, content } = req.body;

      // Verificar que paths y content estén presentes en la solicitud
      if (!paths || !content) {
        res.status(400).send('Solicitud malformada: se requieren paths y contenido');
        return;
      }
  
      // Iterar sobre cada par de path y contenido y realizar la escritura
      const writePromises = paths.map(async (filePath, index) => {
        const fullPath = path.resolve(__dirname, `./src/editor/test/${filePath}`);
        await fs.writeFile(fullPath, content[index], 'utf-8');
      });
  
      // Esperar a que todas las escrituras se completen antes de responder
      await Promise.all(writePromises);
  
      res.status(200).send('Cambios guardados con éxito');
    } catch (error) {
      console.error('Error al modificar el archivo:', error);
      res.status(500).send('Error interno del servidor');
    }
  });




// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});