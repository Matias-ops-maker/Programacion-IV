import { Order, Size, OrderItem } from "../types/order";
import { v4 as uuidv4 } from "uuid";

// Función pura para calcular el precio base según el tamaño
export function calculateBasePrice(size: Size): number {
    const prices = {
        'S': 100,
        'M': 150,
        'L': 200
    };
    return prices[size];
}

// Función pura para calcular el precio de los toppings
export function calculateToppingsPrice(toppings: string[]): number {
    const TOPPING_PRICE = 20;
    return toppings.length * TOPPING_PRICE;
}

// Función pura para calcular el precio total de los items
export function calculateItemsPrice(items: OrderItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Función pura para calcular el precio total del pedido
export function calculateTotalPrice(items: OrderItem[], size: Size, toppings: string[]): number {
    const itemsPrice = calculateItemsPrice(items);
    const basePrice = calculateBasePrice(size);
    const toppingsPrice = calculateToppingsPrice(toppings);
    
    return itemsPrice + basePrice + toppingsPrice;
}

// Función pura para crear un nuevo pedido
export function createNewOrder(
    items: OrderItem[], 
    size: Size, 
    toppings: string[], 
    address: string
): Order {
    const total = calculateTotalPrice(items, size, toppings);
    
    return {
        id: uuidv4(),
        items,
        size,
        toppings,
        address,
        status: "pending",
        total
    };
}

// Función pura para validar si un pedido se puede cancelar
export function canCancelOrder(order: Order): boolean {
    return order.status !== "delivered";
}

// Función pura para cancelar un pedido
export function cancelOrderLogic(order: Order): Order {
    if (!canCancelOrder(order)) {
        throw new Error("No se puede cancelar una orden entregada");
    }
    
    return {
        ...order,
        status: "canceled"
    };
}

// Función pura para validar toppings
export function validateToppings(toppings: string[]): boolean {
    return toppings.length <= 5;
}

// Función pura para validar items
export function validateItems(items: OrderItem[]): boolean {
    return items.length > 0 && items.every(item => 
        item.name.trim().length > 0 && 
        item.quantity > 0 && 
        item.price >= 0
    );
}