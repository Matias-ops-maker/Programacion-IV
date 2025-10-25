# Proyecto Cafetería — Entorno de pruebas

## Persona 1 — Infraestructura y entorno de pruebas

Se dejó listo:
- Proyecto base con Vite + React + TypeScript
- Entorno de tests con Vitest, React Testing Library, MSW y Zod
- MSW interceptando `/api/menu` y `/api/orders`
- Estructura de carpetas lista para continuar el desarrollo:
  - `components/` → Componentes React
  - `hooks/` → Custom hooks
  - `mocks/` → Mock server (MSW)
  - `tests/` → Tests con Vitest + RTL
  - `setupTests.ts` → Configuración global de tests

---

## 📂 Estructura de carpetas
src/
├─ components/ # Componentes React
├─ hooks/ # Custom hooks
├─ mocks/ # Mock server (MSW)
│ ├─ handlers.ts # Handlers de endpoints
│ └─ server.ts # Configuración del server MSW
├─ tests/ # Tests con Vitest + RTL
└─ setupTests.ts # Setup global para tests

---

## ⚙️ Dependencias principales

```bash
npm install

npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom msw zod jsdom

npm run dev → Ejecutar proyecto en modo desarrollo

npm run test → Ejecutar tests en consola
