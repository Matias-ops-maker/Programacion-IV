# Proyecto Cafetería — Entorno de pruebas

## 📂 Estructura de carpetas
```
src/
├─ components/    # Componentes React (ej: `Menu.tsx`, `OrderItem.tsx`, `OrderSummary.tsx`)
├─ hooks/         # Custom hooks (ej: `useOrder.tsx` / `OrderContext.tsx`)
├─ mocks/         # Mock server (MSW)
│  ├─ handlers.ts # Handlers de endpoints (GET /api/menu, POST /api/orders...)
│  └─ server.ts   # Configuración del server MSW (exporta `server`)
├─ tests/         # Tests con Vitest + RTL
└─ setupTests.ts  # Setup global para tests (arranca MSW antes de los tests)
```

---

## ⚙️ Dependencias principales

Instalación de dependencias (ejecutar desde la carpeta del proyecto):

```powershell
npm install
npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom msw zod jsdom
```

Comandos útiles:

```powershell
npm run dev    # Ejecutar proyecto en modo desarrollo (Vite)
npm run test   # Ejecutar tests en consola (Vitest)
```

Nota: estas instrucciones suponen que Node.js y npm están instalados en el sistema.

---

## Roles / Actividades (estado actual)

❎ ROLES / Actividades — Resumen de lo hecho y pendiente

### 🛠 Persona 1 (Francisco) — Infraestructura y entorno de pruebas (Hecho)
Responsable de:
- Crear el proyecto base con Vite + React + TS
- Instalar y configurar Vitest, RTL, MSW, Zod
- Configurar `vite.config.ts` y `setupTests.ts`
- Crear estructura base de carpetas: `components`, `hooks`, `mocks`, `tests`

Entrega esperada:
- Proyecto funcional con entorno de pruebas listo — COMPLETADO
- MSW interceptando `/api/menu` y `/api/orders` — COMPLETADO
- Archivo `server.ts` con handlers mockeados — COMPLETADO

### 🧪 Persona 2 (Ignacio) — Tipado + HU1 (Visualización del menú) (Hecho / Pendiente de test de integración)
Responsable de:
- Definir `ProductSchema` con Zod y tipo `Product`
- Implementar test para visualizar productos mockeados
- Crear componente `<Menu />` con fetch a `/api/menu`
- Validar con `screen.getAllByRole('listitem')`

Entrega esperada:
- Componente `<Menu />` modular — Implementado
- Test RTL que verifica renderizado de productos — Implementado (unit/test de componentes)
- MSW funcionando con productos simulados — COMPLETADO

Notas: revisar que el test de integración local use el `server` de MSW en `setupTests.ts`.

### 🧮 Persona 3 (matias) — Estado del pedido + HU2 y HU3 (Hecho parcialmente)
Responsable de:
- Crear hook `useOrder` o contexto global
- Implementar lógica para agregar ítems al pedido
- Calcular total dinámico
- Tests para agregar ítems y verificar total

Entrega esperada:
- Hook/contexto con `addItem`, `removeItem`, `getTotal` — Implementado (revisar edge-cases)
- Componente `<OrderSummary />` con total — Implementado
- Tests que validen agregados y cálculo — Implementados parcialmente

Notas: validar casos límite (cantidad 0, eliminación de último ítem).

### 🧹 Persona 4 (Lautaro) — Eliminación + HU4 y HU6 (Hecho)
Responsable de:
- Implementar botón "Eliminar" por ítem
- Usar `setState` funcional y `e.stopPropagation()` si hay nesting
- Test para eliminar ítems individualmente
- Simular error 500 y menú vacío con `server.use()` en MSW
- Mostrar mensajes de error o vacío

Entrega esperada:
- Componente `<OrderItem />` con botón eliminar — Implementado
- Tests para eliminación y casos límite — Implementados
- MSW con override de errores — Implementado

### 📦 Persona 5 (Nicolas) — Envío de pedido + Integración completa (Falta)
Responsable de:
- Implementar botón "Enviar pedido"
- Mockear `POST /api/orders` con MSW
- Limpiar estado tras éxito
- Mostrar "Pedido confirmado"
- Test end-to-end: menú → agregar → total → enviar → reset

Entrega esperada:
- Componente `<SubmitOrder />` — Pendiente
- Test completo del flujo — Pendiente
- Reset de interfaz tras envío — Pendiente


## Cómo ejecutar (Windows — PowerShell)

1) Asegurarse de tener Node.js (v16+ recomendado) y npm instalados.
2) Abrir PowerShell en la carpeta del proyecto (la carpeta que contiene `package.json`).

Comandos:

```powershell
# Instalar dependencias
npm install

# Instalar deps de test (si no están en package.json)
npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom msw zod jsdom

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests en consola
npm run test
```

Consejos:
- Si MSW no corre en entorno de test, comprobar que `setupTests.ts` importe y arranque el `server` de `mocks/server`.
- Para probar el override de handlers en tests, usar `server.use()` desde `mocks/handlers`.

---

## Contacto / notas finales
Mantener la rama `main` limpia: crear branches por historia de usuario y abrir PRs pequeños.
Si quieren, puedo agregar un checklist automático en el `README` o un pequeño script `npm run e2e` (con Playwright/Testing Library)