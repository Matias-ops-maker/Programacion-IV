import {
  calculateBasePrice,
  calculateToppingsPrice,
  calculateItemsPrice,
  calculateTotalPrice,
  createNewOrder,
  canCancelOrder,
  cancelOrderLogic,
  validateToppings,
  validateItems
} from '../services/order.logic';
import { Order, Size, OrderItem } from '../types/order';

describe('Order Business Logic - Unit Tests', () => {
  describe('Price Calculations', () => {
    test('calculateBasePrice should return correct prices for each size', () => {
      expect(calculateBasePrice('S')).toBe(100);
      expect(calculateBasePrice('M')).toBe(150);
      expect(calculateBasePrice('L')).toBe(200);
    });

    test('calculateToppingsPrice should calculate correctly', () => {
      expect(calculateToppingsPrice([])).toBe(0);
      expect(calculateToppingsPrice(['cheese'])).toBe(20);
      expect(calculateToppingsPrice(['cheese', 'pepperoni'])).toBe(40);
      expect(calculateToppingsPrice(['cheese', 'pepperoni', 'mushrooms', 'olives', 'ham'])).toBe(100);
    });

    test('calculateItemsPrice should calculate total items price', () => {
      const items: OrderItem[] = [
        { name: 'Pizza Margherita', quantity: 2, price: 15.99 },
        { name: 'Coca Cola', quantity: 1, price: 2.50 }
      ];
      
      expect(calculateItemsPrice(items)).toBeCloseTo(34.48, 2); // (15.99 * 2) + (2.50 * 1)
    });

    test('calculateTotalPrice should calculate complete order total', () => {
      const items: OrderItem[] = [
        { name: 'Pizza Margherita', quantity: 1, price: 15.99 }
      ];
      const size: Size = 'M';
      const toppings = ['cheese', 'pepperoni'];
      
      const total = calculateTotalPrice(items, size, toppings);
      expect(total).toBeCloseTo(205.99, 2); // 15.99 + 150 + 40
    });
  });

  describe('Order Creation', () => {
    test('createNewOrder should create a valid order', () => {
      const items: OrderItem[] = [
        { name: 'Pizza Margherita', quantity: 1, price: 15.99 }
      ];
      const size: Size = 'L';
      const toppings = ['cheese'];
      const address = 'Calle Falsa 123, Springfield';

      const order = createNewOrder(items, size, toppings, address);

      expect(order).toMatchObject({
        items,
        size,
        toppings,
        address,
        status: 'pending'
      });
      expect(order.total).toBeCloseTo(235.99, 2); // 15.99 + 200 + 20
      expect(order.id).toBeDefined();
      expect(typeof order.id).toBe('string');
    });
  });

  describe('Order Cancellation', () => {
    test('canCancelOrder should return true for non-delivered orders', () => {
      const pendingOrder: Order = {
        id: '1',
        items: [],
        size: 'S',
        toppings: [],
        address: 'Test Address',
        status: 'pending',
        total: 100
      };

      expect(canCancelOrder(pendingOrder)).toBe(true);
    });

    test('canCancelOrder should return false for delivered orders', () => {
      const deliveredOrder: Order = {
        id: '1',
        items: [],
        size: 'S',
        toppings: [],
        address: 'Test Address',
        status: 'delivered',
        total: 100
      };

      expect(canCancelOrder(deliveredOrder)).toBe(false);
    });

    test('cancelOrderLogic should cancel a valid order', () => {
      const order: Order = {
        id: '1',
        items: [],
        size: 'S',
        toppings: [],
        address: 'Test Address',
        status: 'pending',
        total: 100
      };

      const canceledOrder = cancelOrderLogic(order);
      expect(canceledOrder.status).toBe('canceled');
      expect(canceledOrder.id).toBe(order.id);
    });

    test('cancelOrderLogic should throw error for delivered orders', () => {
      const deliveredOrder: Order = {
        id: '1',
        items: [],
        size: 'S',
        toppings: [],
        address: 'Test Address',
        status: 'delivered',
        total: 100
      };

      expect(() => cancelOrderLogic(deliveredOrder)).toThrow('No se puede cancelar una orden entregada');
    });
  });

  describe('Validations', () => {
    test('validateToppings should return true for valid toppings count', () => {
      expect(validateToppings([])).toBe(true);
      expect(validateToppings(['cheese'])).toBe(true);
      expect(validateToppings(['cheese', 'pepperoni', 'mushrooms', 'olives', 'ham'])).toBe(true);
    });

    test('validateToppings should return false for too many toppings', () => {
      expect(validateToppings(['1', '2', '3', '4', '5', '6'])).toBe(false);
    });

    test('validateItems should return true for valid items', () => {
      const validItems: OrderItem[] = [
        { name: 'Pizza', quantity: 1, price: 10 },
        { name: 'Drink', quantity: 2, price: 5 }
      ];
      
      expect(validateItems(validItems)).toBe(true);
    });

    test('validateItems should return false for empty items array', () => {
      expect(validateItems([])).toBe(false);
    });

    test('validateItems should return false for items with invalid data', () => {
      const invalidItems: OrderItem[] = [
        { name: '', quantity: 1, price: 10 }, // empty name
        { name: 'Valid', quantity: 0, price: 5 } // zero quantity
      ];
      
      expect(validateItems(invalidItems)).toBe(false);
    });
  });
});