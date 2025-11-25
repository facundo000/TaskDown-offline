# 📋 Planificación MVP - TaskDown (Descontador de Tareas)

## 🎯 Objetivo
Descontador de tareas accesible desde web y extensión de navegador, con diseño minimalista inspirado en Excalidraw.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Angular 17+ + Tailwind CSS
- **Extensión:** Manifest V3 (Chrome/Edge)
- **Hosting:** Vercel / Netlify

---

## ✨ Funcionalidades MVP

### Gestión de Tareas
- Crear múltiples tareas (título, descripción opcional con URL, cantidad inicial)
- Listar todas las tareas del usuario
- Editar tarea (título, descripción, URL)
- Eliminar tarea con confirmación

### Sistema de Descuento
- Botón "-1" para descontar
- Campo para restablecer a valor específico
- Botón para restablecer al valor inicial
- No permitir valores negativos

### Visualización
- Barra de progreso animada (%)
- Contador actual/inicial
- Animación al completar tarea
- Vista de tarjetas tipo Excalidraw

### Historial
- Últimas 10 acciones por tarea
- Formato: "DD/MM/YYYY HH:mm - Descontado: 1"
- Ordenado de más reciente a más antiguo

### Extensión
- Popup compacto con lista de tareas
- Botón "-1" funcional

## 🎨 Diseño (Estilo Excalidraw)

### Paleta de Colores
```css
--primary: #6965db;
--secondary: #ffc58b;
--success: #7bc863;
--danger: #e03c3c;
--bg-primary: #ffffff;
--bg-secondary: #f8f9fa;
--text-primary: #1e1e1e;
--text-secondary: #6c757d;
```

### Tipografía
- Fuente principal: 'Virgil' o 'Segoe Print' (handwritten)
- Fuente secundaria: 'Inter' o system fonts

### Componentes Clave
- Cards con bordes redondeados y sombras suaves
- Botones con hover y animaciones sutiles
- Progress bar con gradiente animado
- Confetti al completar tarea


## 🚀 Comandos Importantes

### Instalación Inicial
```bash
# Crear proyecto
git clone https://github.com/facundo000/TaskDown-offline
cd TaskDown-offline

# Instalar dependencias
npm install
```

### Desarrollo
```bash
# Servidor de desarrollo
ng serve

# Build de producción
# (copiar archivos de dist/ a extension/popup/)
npm run build

```

## 🎨 Inspiración de Diseño

- Excalidraw: https://excalidraw.com
- Dribbble (task managers): https://dribbble.com/search/task-tracker
- Figma Community (minimalista)
