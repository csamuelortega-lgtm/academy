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
const getCouchDbDatabase = () => process.env.COUCHDB_DB || process.env.COUCHDB_DATABASE || process.env.COUCHDB_USERS_DB || 'clientes';
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
  username: document.username || document.usuario || '',
  role: document.role || document.rol || document.type || 'usuario',
  database: getCouchDbDatabase(),
});

async function findUserDocument(identifier) {
  const rawIdentifier = String(identifier || '').trim();
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const databaseUrl = getCouchDbBaseUrl();
  const databaseName = getCouchDbDatabase();

  const response = await fetch(`${databaseUrl}/${encodeURIComponent(databaseName)}/_find`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCouchDbAuthHeader(),
    },
    body: JSON.stringify({
      selector: {
        $or: [
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
  recipeName: document.recipeName || '',
  notes: document.notes || '',
  drinks: Array.isArray(document.drinks) ? document.drinks : [],
  totalMl: Number(document.totalMl || 0),
  createdAt: document.createdAt || null,
  updatedAt: document.updatedAt || null,
});

const isAllowedDrink = (value) => ['coca-cola', 'fanta', 'sprite'].includes(value);

const flavorCatalog = {
  'coca-cola': ['Vainilla', 'Cereza', 'Lima', 'Canela'],
  fanta: ['Naranja intensa', 'Uva', 'Pina', 'Durazno'],
  sprite: ['Limon', 'Hierbabuena', 'Pepino', 'Jengibre'],
};

const normalizeDrinks = (drinks) => {
  if (!Array.isArray(drinks)) {
    throw new Error('La lista de refrescos no es valida');
  }

  const normalized = drinks.map((item) => {
    const drink = String(item?.drink || '').trim().toLowerCase();
    const flavor = String(item?.flavor || '').trim();
    const ml = Number(item?.ml);

    if (!isAllowedDrink(drink)) {
      throw new Error('Refresco no permitido');
    }

    if (!flavorCatalog[drink].includes(flavor)) {
      throw new Error('Saborizante no permitido para el refresco seleccionado');
    }

    if (!Number.isFinite(ml) || ml <= 0) {
      throw new Error('Cantidad invalida en ml');
    }

    return {
      drink,
      flavor,
      ml: Math.round(ml * 100) / 100,
    };
  });

  if (normalized.length === 0) {
    throw new Error('Debes agregar al menos un refresco a la mezcla');
  }

  return normalized;
};

async function couchDbRequest(endpoint, options = {}) {
  const response = await fetch(`${getCouchDbBaseUrl()}/${encodeURI(getCouchDbDatabase())}${endpoint}`, {
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

        const result = await couchDbRequest('/_find', {
          method: 'POST',
          body: JSON.stringify({
            selector: {
              type: 'mix',
              ownerKey,
            },
            sort: [{ updatedAt: 'desc' }],
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
        const drinks = normalizeDrinks(req.body?.drinks);

        if (!ownerKey) {
          res.status(400).json({ message: 'No se pudo identificar el usuario actual' });
          return;
        }

        if (!recipeName) {
          res.status(400).json({ message: 'El nombre de la mezcla es obligatorio' });
          return;
        }

        const now = new Date().toISOString();
        const totalMl = drinks.reduce((acc, item) => acc + item.ml, 0);

        const payload = {
          type: 'mix',
          ownerKey,
          ownerEmail: req.session?.user?.email || '',
          recipeName,
          notes,
          drinks,
          totalMl,
          createdAt: now,
          updatedAt: now,
        };

        const createResult = await couchDbRequest('', {
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
        const drinks = normalizeDrinks(req.body?.drinks);

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

        const existing = await couchDbRequest(`/${encodeURIComponent(mixId)}`, { method: 'GET' });

        if (existing.type !== 'mix' || existing.ownerKey !== ownerKey) {
          res.status(403).json({ message: 'No tienes permisos para editar esta mezcla' });
          return;
        }

        if (existing._rev !== revision) {
          res.status(409).json({ message: 'La mezcla fue actualizada por otro proceso, recarga la lista' });
          return;
        }

        const totalMl = drinks.reduce((acc, item) => acc + item.ml, 0);

        const nextPayload = {
          ...existing,
          recipeName,
          notes,
          drinks,
          totalMl,
          updatedAt: new Date().toISOString(),
        };

        const updateResult = await couchDbRequest(`/${encodeURIComponent(mixId)}`, {
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