# Trabajo Práctico 2 - API REST para Manejo de Pedidos

## Descripción

API REST desarrollada con TypeScript, Express y Zod para el manejo de pedidos de comida. Implementa validaciones robustas, lógica de negocio separada y tests unitarios/integración.

## Características Implementadas

### ✅ API y rutas base
- ✅ `makeApp()` con Express configurado
- ✅ Rutas `/orders` y `/orders/:id/cancel`
- ✅ Middlewares para parseo JSON y manejo de errores

### ✅ Validaciones con Zod
- ✅ Validación de estructura del pedido (items, size, toppings)
- ✅ Rechazo de pedidos inválidos (sin items, más de 5 toppings)
- ✅ Validaciones integradas en servicios

### ✅ Lógica de negocio
- ✅ Cálculo de precio: items + size base + toppings
- ✅ Cancelación con restricción (status !== delivered)
- ✅ Lógica separada en funciones puras testeables

### ✅ Tests unitarios (TDD)
- ✅ Tests para lógica de precio y cancelación
- ✅ Tests para validaciones Zod
- ✅ Configuración Jest

### ✅ Tests de integración
- ✅ Endpoints con Supertest
- ✅ Validación de status codes:
  - 422 si el pedido no tiene items
  - 409 si se intenta cancelar un pedido entregado
  - 201 para creación exitosa
  - 404 para recursos no encontrados

## Estructura del Proyecto

```
src/
├── app.ts                  # Configuración de Express
├── server.ts              # Servidor principal
├── types/
│   └── order.ts           # Tipos TypeScript
├── validations/
│   └── order.schema.ts    # Esquemas Zod
├── services/
│   ├── order.logic.ts     # Lógica de negocio pura
│   └── orders.servicio.ts # Servicios de datos
├── rutas/
│   └── orders.rutas.ts    # Rutas Express
└── tests/
    ├── setup.ts           # Configuración tests
    ├── orders.unit.test.ts    # Tests unitarios
    └── orders.int.test.ts     # Tests integración
```

## Instalación

### Opción 1: Instalación Automática (Recomendada para principiantes)

Los archivos `setup.bat` (Windows) y `setup.sh` (Linux/Mac) son **scripts opcionales de conveniencia** que automatizan todo el proceso de configuración.

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

Estos scripts automáticamente:
- ✅ Verifican que Node.js y npm estén instalados
- ✅ Instalan las dependencias del proyecto
- ✅ Compilan TypeScript
- ✅ Ejecutan los tests para verificar que todo funcione
- ✅ Muestran los comandos disponibles

> **Nota:** Estos scripts **NO son obligatorios**. Son solo una herramienta de ayuda para configurar el proyecto más fácilmente. Puedes ignorarlos si prefieres hacer la instalación manual.

### Opción 2: Instalación Manual

Si prefieres tener más control sobre el proceso, puedes ejecutar los comandos manualmente:

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## Tests

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Solo tests de integración
npm run test:integration
```

## API Endpoints

### POST /orders
Crear un nuevo pedido.

**Body:**
```json
{
  "items": [
    {
      "name": "Pizza Margherita",
      "quantity": 1,
      "price": 15.99
    }
  ],
  "size": "M",
  "toppings": ["cheese", "pepperoni"],
  "address": "Calle Falsa 123, Springfield"
}
```

**Response (201):**
```json
{
  "id": "uuid-string",
  "items": [...],
  "size": "M",
  "toppings": ["cheese", "pepperoni"],
  "address": "Calle Falsa 123, Springfield",
  "status": "pending",
  "total": 205.99
}
```

### GET /orders/:id
Obtener un pedido por ID.

**Response (200):**
```json
{
  "id": "uuid-string",
  "items": [...],
  "size": "M",
  "status": "pending",
  "total": 205.99
}
```

### GET /orders?status=pending
Listar pedidos, opcionalmente filtrados por status.

**Response (200):**
```json
[
  {
    "id": "uuid-string",
    "status": "pending",
    ...
  }
]
```

### POST /orders/:id/cancel
Cancelar un pedido (si no está entregado).

**Response (200):**
```json
{
  "id": "uuid-string",
  "status": "canceled",
  ...
}
```

## Lógica de Negocio

### Cálculo de Precio
- **Size**: S ($100), M ($150), L ($200)
- **Toppings**: $20 cada uno (máximo 5)
- **Total**: Suma de items + precio size + precio toppings

### Validaciones
- ✅ Mínimo 1 item por pedido
- ✅ Máximo 5 toppings
- ✅ Dirección mínimo 10 caracteres
- ✅ Size válido (S, M, L)
- ✅ Items con nombre, cantidad > 0 y precio >= 0

### Estados de Pedido
- `pending`: Recién creado
- `delivered`: Entregado (no se puede cancelar)
- `canceled`: Cancelado

## Códigos de Estado HTTP

- **200**: Operación exitosa
- **201**: Recurso creado exitosamente
- **404**: Recurso no encontrado
- **409**: Conflicto (ej: cancelar pedido entregado)
- **422**: Datos de entrada inválidos
- **500**: Error interno del servidor

## Tecnologías Utilizadas

- **TypeScript**: Tipado estático
- **Express**: Framework web
- **Zod**: Validación de schemas
- **UUID**: Generación de IDs únicos
- **Jest**: Framework de testing
- **Supertest**: Testing de APIs HTTP

## Arquitectura

La aplicación sigue principios de **Clean Architecture**:

1. **Dominio** (`types/`): Entidades y tipos de negocio
2. **Lógica de Negocio** (`services/order.logic.ts`): Funciones puras
3. **Servicios** (`services/orders.servicio.ts`): Casos de uso
4. **Controladores** (`rutas/`): Manejo HTTP
5. **Validaciones** (`validations/`): Esquemas de entrada

## Próximas Mejoras

- [ ] Persistencia en base de datos
- [ ] Autenticación y autorización
- [ ] Logging estructurado
- [ ] Rate limiting
- [ ] Documentación OpenAPI/Swagger
- [ ] Métricas y monitoreo  
Incluye validaciones de entrada, reglas de negocio y endpoints para crear, listar, consultar y cancelar órdenes.

---

## 📂 Estructura del proyecto
2 - TRABAJO PRACTICO 2/
├── src/
│ ├── app.ts # makeApp() y configuración de Express
│ ├── server.ts # levantar servidor
│ ├── rutas/
│ │ └── orders.rutas.ts # endpoints /orders
│ ├── services/
│ │ └── orders.service.ts # reglas de negocio
│ ├── types/
│ │ └── order.ts # interfaces y enums
│ └── tests/ # tests unitarios e integración
│ ├── orders.unit.test.ts
│ └── orders.int.test.ts
├── package.json
├── tsconfig.json
└── README.md


---

## ⚡ Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/Matias-ops-maker/Programacion-IV.git
cd 2 - Trabajo Practico 2


2. Instalar dependecias:

npm install
npm install zod uuid
npm install -D @types/uuid ts-node typescript nodemon

Levantar el Servidor.

# Con ts-node
npx ts-node src/server.ts

# O con nodemon para recarga automática
npx nodemon src/server.ts

El servidor corre en: http://localhost:3000
