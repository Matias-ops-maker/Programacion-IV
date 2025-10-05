import { clearAllOrders } from '../services/orders.servicio';

// Limpiar datos antes de cada test
beforeEach(() => {
  clearAllOrders();
});