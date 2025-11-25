# TaskDown Browser Extension

Extensión de navegador para TaskDown que permite gestionar tareas directamente desde la barra de herramientas del navegador.

## 🚀 Características

- **Acceso rápido**: Gestiona tus tareas sin abrir la aplicación web completa
- **Sincronización automática**: Mantén la sesión sincronizada con la aplicación web
- **Interfaz compacta**: Diseño optimizado para espacios reducidos
- **Funcionalidad completa**: Crear, editar, eliminar y decrementar tareas
- **Notificaciones visuales**: Feedback inmediato con animaciones de confetti

## 📁 Estructura del Proyecto

```
extension/
├── manifest.json          # Configuración de la extensión (Manifest V3)
├── popup/
│   ├── popup.html         # Interfaz del popup
│   ├── popup.css          # Estilos inspirados en Excalidraw
│   └── popup.js           # Lógica del popup
├── supabase.js            # Cliente Supabase para extensiones
├── background.js          # Script de fondo para sincronización
├── content.js             # Script de contenido para monitoreo de auth
├── icons/                 # Íconos de la extensión
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # Este archivo
```

## 🛠️ Instalación y Desarrollo

### Prerrequisitos

- Google Chrome o Microsoft Edge (soporte Manifest V3)
- Una instancia de TaskDown corriendo localmente o en producción

### Instalación

1. **Clona o descarga** los archivos de la extensión en una carpeta local

2. **Configura las credenciales**:
   - Edita `extension/supabase.js` y reemplaza:
     ```javascript
     const SUPABASE_URL = 'YOUR_SUPABASE_URL';
     const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
     ```
   - También actualiza las URLs en `manifest.json` y `content.js`

3. **Carga la extensión en Chrome**:
   - Abre `chrome://extensions/`
   - Activa "Modo desarrollador" (esquina superior derecha)
   - Haz clic en "Cargar descomprimida"
   - Selecciona la carpeta `extension/`

4. **Verifica la instalación**:
   - Deberías ver el ícono de TaskDown en la barra de herramientas
   - Haz clic para abrir el popup

### Desarrollo

#### Configuración de URLs

Para desarrollo local, actualiza estas URLs en los archivos:

- `manifest.json`: `"*://localhost:*/*"`
- `content.js`: `window.location.hostname.includes('localhost')`
- `popup.js`: URLs de redireccionamiento

#### Debugging

- **Popup**: Haz clic derecho en el ícono → "Inspeccionar popup"
- **Background Script**: Ve a `chrome://extensions/` → "service worker" de TaskDown
- **Content Script**: Abre DevTools en la página de TaskDown → Console

## � Sincronización de Tareas (Bidireccional)

La extensión sincroniza tareas locales con la aplicación web de forma bidireccional:

### Flujo de Sincronización

#### 1. Extension → Web (Creación de tareas)
```
Popup crea tarea
  ↓
Guarda en localStorage del popup
  ↓
Guarda en chrome.storage.sync
  ↓
Background script detecta cambio
  ↓
Notifica al content script
  ↓
Content script actualiza localStorage de la web
  ↓
Web app muestra la tarea ✅
```

#### 2. Web → Extension (Ediciones automáticas)
```
Web edita tarea (decrementar, completar, etc.)
  ↓
LocalStorage del web se actualiza
  ↓
Content script detecta cambio
  ↓
Sincroniza a chrome.storage
  ↓
Background script detecta cambio
  ↓
Notifica al popup
  ↓
Popup recarga tareas automáticamente ✅
```

#### 3. Content Scripts
- **content.js**: Monitorea cambios de autenticación
- **content.sync.js**: Sincroniza tareas entre popup y web app
  - Lee chrome.storage.sync desde la extensión
  - Escribe/lee localStorage de la web
  - Escucha eventos de cambio en ambas direcciones
  - Se ejecuta automáticamente al cargar la página (en localhost:4200)

### Configuración Importante

El content script está configurado para inyectarse en:
- `http://localhost:4200/*` (desarrollo local)
- `http://127.0.0.1:4200/*` (alternativa IP)
- `*://your-taskdown-app.com/*` (producción)

**Para que funcione correctamente**:
1. Asegúrate de que tu app web está en `http://localhost:4200`
2. La extensión debe estar cargada desde `chrome://extensions`
3. Abre DevTools en la web y verifica que `content.sync.js` esté cargado
4. Revisa la consola para mensajes como "🔌 Content sync script loaded"

### Sincronización Manual

También puedes forzar sincronización con el botón 🔄 en la web app:
1. Click en el botón de sincronización
2. Content script lee desde chrome.storage
3. Actualiza localStorage de la web
4. Web app muestra tareas del popup ✅

---

## �🔧 Configuración

### Credenciales de Supabase

La extensión necesita las mismas credenciales que la aplicación web:

```javascript
// En extension/supabase.js
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key';
```

### URLs de la Aplicación

Actualiza todas las referencias a URLs en:
- `manifest.json` (content_scripts matches)
- `content.js` (hostname checks)
- `popup.js` (URLs de redireccionamiento)

## 🔄 Sincronización de Autenticación

La extensión sincroniza automáticamente la sesión de autenticación con la aplicación web:

1. **Content Script** (`content.js`): Monitorea cambios de auth en la web app
2. **Background Script** (`background.js`): Almacena la sesión en chrome.storage
3. **Popup** (`popup.js`): Lee la sesión almacenada para autenticar requests

### Flujo de Sincronización

```
Web App Login → Content Script Detecta → Background Script Almacena → Popup Lee Sesión
```

## 🎨 Diseño

El diseño está inspirado en Excalidraw con:
- Paleta de colores minimalista
- Bordes redondeados y sombras suaves
- Animaciones sutiles
- Interfaz responsive

## 🚀 Funcionalidades

### Popup Principal
- Lista de tareas pendientes (máximo 10)
- Botón de decremento con animación
- Barra de progreso visual
- Estados de carga y error
- Enlaces directos a la aplicación web

### Sincronización
- Sesión compartida con la web app
- Actualizaciones en tiempo real
- Manejo de sesiones expiradas

### Interfaz
- Diseño compacto optimizado para popup
- Estados vacíos informativos
- Feedback visual para acciones
- Animaciones de confetti al completar tareas

## 🐛 Solución de Problemas

### La extensión no se carga
- Verifica que todos los archivos estén en la carpeta correcta
- Revisa la consola de errores en `chrome://extensions/`
- Asegúrate de que el manifest.json sea válido

### No se sincroniza la autenticación
- Verifica que estés logueado en la web app
- Revisa que las URLs en content.js coincidan con tu dominio
- Chequea chrome.storage.local desde DevTools

### Error de conexión con Supabase
- Verifica las credenciales en supabase.js
- Revisa la consola del popup para errores de red
- Asegúrate de que CORS esté configurado correctamente

## 📝 Notas de Desarrollo

- La extensión usa Manifest V3 (requerido para Chrome/Edge modernos)
- El cliente Supabase es una versión minimalista adaptada para extensiones
- Las sesiones se almacenan localmente usando chrome.storage
- El popup se cierra automáticamente al hacer clic en enlaces externos

## 🔒 Seguridad

- Las credenciales se almacenan solo localmente
- No se transmiten datos sensibles sin encriptación
- Se valida la autenticación en cada request
- Las sesiones expiradas se limpian automáticamente

## 📄 Licencia

Este proyecto es parte de TaskDown. Ver términos de uso en la aplicación principal.