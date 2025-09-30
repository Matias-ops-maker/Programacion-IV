# TP2 - Pedidos de Pizzería

## Descripción

API pequeña de pedidos de pizzería, desarrollada con **TypeScript + Express + Zod**, siguiendo TDD.  
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
git clone <URL_DEL_REPO>
cd tp2-pizzeria


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