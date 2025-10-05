import { Order, Size, OrderItem } from "../types/order";
import { createNewOrder, cancelOrderLogic, canCancelOrder } from "./order.logic";

// Almacenamiento en memoria (en producción sería una base de datos)
const orders: Order[] = [];

// Interfaz para crear una orden
export interface CreateOrderData {
    items: OrderItem[];
    size: Size;
    toppings: string[];
    address: string;
}

// Servicio para crear una orden
export function createOrder(data: CreateOrderData): Order {
    const { items, size, toppings, address } = data;
    
    // Usar la lógica de negocio pura
    const order = createNewOrder(items, size, toppings, address);
    
    // Guardar en el almacén
    orders.push(order);
    
    return order;
}

// Servicio para obtener una orden por ID
export function getOrder(id: string): Order | undefined {
    return orders.find(order => order.id === id);
}

// Servicio para listar órdenes (con filtro opcional por status)
export function listOrders(status?: string): Order[] {
    if (!status) {
        return [...orders]; // Retornar copia para evitar mutaciones
    }
    return orders.filter(order => order.status === status);
}

// Servicio para cancelar una orden
export function cancelOrder(id: string): Order {
    const orderIndex = orders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
        throw new Error("Order no encontrada");
    }
    
    const order = orders[orderIndex];
    
    // Usar la lógica de negocio pura
    const canceledOrder = cancelOrderLogic(order);
    
    // Actualizar en el almacén
    orders[orderIndex] = canceledOrder;
    
    return canceledOrder;
}

// Función para obtener todas las órdenes (útil para testing)
export function getAllOrders(): Order[] {
    return [...orders];
}

// Función para limpiar todas las órdenes (útil para testing)
export function clearAllOrders(): void {
    orders.length = 0;
}