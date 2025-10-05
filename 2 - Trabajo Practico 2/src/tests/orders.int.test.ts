import request from 'supertest';
import { makeApp } from '../app';
import { clearAllOrders } from '../services/orders.servicio';

const app = makeApp();

describe('Orders API - Integration Tests', () => {
  beforeEach(() => {
    clearAllOrders();
  });

  describe('POST /orders', () => {
    test('should create a valid order', async () => {
      const orderData = {
        items: [
          { name: 'Pizza Margherita', quantity: 1, price: 15.99 }
        ],
        size: 'M',
        toppings: ['cheese', 'pepperoni'],
        address: 'Calle Falsa 123, Springfield'
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(201);

      expect(response.body).toMatchObject({
        items: orderData.items,
        size: orderData.size,
        toppings: orderData.toppings,
        address: orderData.address,
        status: 'pending'
      });
      expect(response.body.total).toBeCloseTo(205.99, 2); // 15.99 + 150 + 40
      expect(response.body.id).toBeDefined();
    });

    test('should return 422 when order has no items', async () => {
      const invalidOrderData = {
        items: [], // Sin items
        size: 'M',
        toppings: ['cheese'],
        address: 'Calle Falsa 123, Springfield'
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidOrderData)
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Datos de entrada inválidos');
    });

    test('should return 422 when order has more than 5 toppings', async () => {
      const invalidOrderData = {
        items: [
          { name: 'Pizza', quantity: 1, price: 10 }
        ],
        size: 'M',
        toppings: ['cheese', 'pepperoni', 'mushrooms', 'olives', 'ham', 'pineapple'], // 6 toppings
        address: 'Calle Falsa 123, Springfield'
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidOrderData)
        .expect(422);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Datos de entrada inválidos');
    });

    test('should return 422 when address is too short', async () => {
      const invalidOrderData = {
        items: [
          { name: 'Pizza', quantity: 1, price: 10 }
        ],
        size: 'M',
        toppings: ['cheese'],
        address: 'Short' // Menos de 10 caracteres
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidOrderData)
        .expect(422);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 422 when size is invalid', async () => {
      const invalidOrderData = {
        items: [
          { name: 'Pizza', quantity: 1, price: 10 }
        ],
        size: 'XL', // Size inválido
        toppings: ['cheese'],
        address: 'Calle Falsa 123, Springfield'
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidOrderData)
        .expect(422);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /orders/:id', () => {
    test('should return an existing order', async () => {
      // Primero crear una orden
      const orderData = {
        items: [
          { name: 'Pizza', quantity: 1, price: 10 }
        ],
        size: 'S',
        toppings: [],
        address: 'Calle Falsa 123, Springfield'
      };

      const createResponse = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;

      // Luego obtenerla
      const response = await request(app)
        .get(`/orders/${orderId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: orderId,
        items: orderData.items,
        size: orderData.size,
        status: 'pending'
      });
    });

    test('should return 404 for non-existing order', async () => {
      const response = await request(app)
        .get('/orders/non-existing-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Order no encontrada');
    });
  });

  describe('GET /orders', () => {
    test('should return all orders when no status filter', async () => {
      // Crear algunas órdenes
      const orderData1 = {
        items: [{ name: 'Pizza 1', quantity: 1, price: 10 }],
        size: 'S',
        toppings: [],
        address: 'Address 1, Springfield'
      };

      const orderData2 = {
        items: [{ name: 'Pizza 2', quantity: 1, price: 15 }],
        size: 'M',
        toppings: ['cheese'],
        address: 'Address 2, Springfield'
      };

      await request(app).post('/orders').send(orderData1);
      await request(app).post('/orders').send(orderData2);

      const response = await request(app)
        .get('/orders')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    test('should filter orders by status', async () => {
      // Crear una orden y cancelarla
      const orderData = {
        items: [{ name: 'Pizza', quantity: 1, price: 10 }],
        size: 'S',
        toppings: [],
        address: 'Address, Springfield'
      };

      const createResponse = await request(app)
        .post('/orders')
        .send(orderData);

      const orderId = createResponse.body.id;

      await request(app)
        .post(`/orders/${orderId}/cancel`);

      // Filtrar por status canceled
      const response = await request(app)
        .get('/orders?status=canceled')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('canceled');
    });
  });

  describe('POST /orders/:id/cancel', () => {
    test('should cancel a pending order', async () => {
      // Crear una orden
      const orderData = {
        items: [{ name: 'Pizza', quantity: 1, price: 10 }],
        size: 'S',
        toppings: [],
        address: 'Address, Springfield'
      };

      const createResponse = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(201);

      const orderId = createResponse.body.id;

      // Cancelar la orden
      const response = await request(app)
        .post(`/orders/${orderId}/cancel`)
        .expect(200);

      expect(response.body.status).toBe('canceled');
      expect(response.body.id).toBe(orderId);
    });

    test('should return 404 when trying to cancel non-existing order', async () => {
      const response = await request(app)
        .post('/orders/non-existing-id/cancel')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Order no encontrada');
    });

    test('should return 409 when trying to cancel a delivered order', async () => {
      // Crear una orden
      const orderData = {
        items: [{ name: 'Pizza', quantity: 1, price: 10 }],
        size: 'S',
        toppings: [],
        address: 'Address, Springfield'
      };

      const createResponse = await request(app)
        .post('/orders')
        .send(orderData);

      const orderId = createResponse.body.id;

      // Simular que la orden fue entregada (esto requeriría un endpoint adicional o acceso directo al servicio)
      // Por ahora, vamos a testear con una orden que manualmente marcamos como delivered
      // En un escenario real, tendríamos un endpoint para cambiar el status a delivered

      // Para este test, vamos a usar el servicio directamente
      const { getAllOrders } = require('../services/orders.servicio');
      const orders = getAllOrders();
      const order = orders.find((o: any) => o.id === orderId);
      if (order) {
        order.status = 'delivered';
      }

      const response = await request(app)
        .post(`/orders/${orderId}/cancel`)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('No se puede cancelar una orden entregada');
    });
  });
});