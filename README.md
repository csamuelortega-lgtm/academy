# Estructura del proyecto React

Este proyecto combina un **frontend en React** con un **servidor Express** sencillo para leer y escribir archivos de ejemplo (tests).

## Raíz del proyecto

- `package.json`: dependencias, scripts y versión de Node.
- `index.js`: servidor Express que expone la API `/api/test`.
- `craco.config.js`: configuración extra de CRA (aliases y CSS modules).
- `webpack.config.js`: ajustes adicionales de Webpack.
- `public/index.html`: HTML base donde se monta la app (`id="app"`).

## Carpeta `src/`

- `src/index.jsx`
  - Punto de entrada de React.
  - Crea el `root` y configura `react-router-dom`.
  - Rutas:
    - `/` → layout de editor + preview.
    - `/editor` → layout de editor + preview (protegido por sesión).
    - `/home` → `Home` (landing).
    - `/mixmastersdrinks` → landing principal con login integrado.
    - `/test/*` → test de ejemplo (`src/editor/test/001/index.jsx`).
    - `/simple` → `SimplePage` (página de botones).

- `src/style.css`
  - Estilos globales simples (reset básico del body, etc.).

### Carpeta `src/editor/`

Esta carpeta contiene todo lo relacionado con el **playground del editor**.

- `src/editor/index.jsx`
  - Layout principal del editor.
  - Divide la pantalla en dos columnas:
    - Izquierda: componente `Editor` (Monaco).
    - Derecha: `iframe` que carga `/test/<id>`.

- `src/editor/Editor.jsx`
  - Componente que usa `@monaco-editor/react`.
  - Gestiona el estado de tres archivos:
    - `jsx`: por ejemplo `/001/index.jsx`.
    - `css`: `/001/style.css`.
    - `js`: `/001/index.js`.
  - Al montar:
    - Hace un `POST` a `http://localhost:3002/api/test` para leer el contenido de esos archivos.
  - Al guardar (botón o `Ctrl+S`):
    - Hace un `PUT` a `/api/test` enviando los nuevos contenidos.

- `src/editor/index.module.css`
  - Estilos del layout del editor:
    - Distribución en dos columnas.
    - Estilos de la barra de botones del editor.
    - Estilos del `iframe` de previsualización.

#### Carpeta `src/editor/test/001/`

Ejemplo concreto de **test/ejercicio**:

- `index.jsx`
  - Página hecha con `react-onsenui` (tarjeta, botones, lista).
  - Importa funciones desde `index.js`.
- `index.js`
  - Exporta funciones (`fn1`, `fn2`, `fn3`) que se usan en el JSX.
- `style.css`
  - Estilos específicos del test (si se utilizan).

La idea es que el editor cargue y modifique estos archivos para que el `iframe` muestre los cambios en tiempo real.

## Otras páginas

- `src/home.jsx` + `src/home.css`
  - Landing page estática con secciones:
    - Header con logo y navegación.
    - Sección hero.
    - Sección de productos.
    - Sección de historia.
    - Footer.

- `src/SimplePage.jsx`
  - Página sencilla de ejemplo con un título y varios botones de colores elegantes (principal, confirmación, sutil, información, advertencia).

## Flujo de trabajo resumido

1. `npm start`:
   - Arranca React (CRACO) y el servidor Express.
2. El usuario entra en `/`:
   - Ve el editor y la previsualización.
3. El editor:
   - Lee archivos del test actual desde `src/editor/test/001`.
   - Envía cambios al backend con `PUT /api/test`.
4. El `iframe`:
   - Muestra `/test/001`, que consume los archivos modificados.

## Autenticación

- `index.js` expone:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- El login se renderiza dentro de `src/MixMastersDrinks.jsx` en la sección `#auth`.
- La consulta de usuarios usa CouchDB con estas variables opcionales:
  - `COUCHDB_URL`
  - `COUCHDB_DB`, `COUCHDB_DATABASE` o `COUCHDB_USERS_DB` (por defecto: `clientes`)
  - `COUCHDB_USERNAME` y `COUCHDB_PASSWORD`
- El frontend guarda la sesión en `localStorage` con la clave `git-academy-auth`.

