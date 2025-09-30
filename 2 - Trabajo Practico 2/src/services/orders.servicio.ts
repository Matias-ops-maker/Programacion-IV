import { Order, Size } from "../types/order";
import { v4 as uuidv4 } from "uuid";

const orders: Order[] = [];

export function createOrder(data: Partial<Order>): Order {
  const { items, size, toppings = [], address } = data;

  if (!items || items.length === 0) throw new Error("Items no pueden estar vacíos");
  if (!address || address.length < 10) throw new Error("Address mínimo 10 caracteres");
  if (!["S", "M", "L"].includes(size!)) throw new Error("Size inválido");
  if (toppings.length > 5) throw new Error("Máx. 5 toppings");

  const basePrice = size === "S" ? 100 : size === "M" ? 150 : 200;
  const toppingsPrice = toppings.length * 20;
  const total = basePrice + toppingsPrice;

  const order: Order = {
    id: uuidv4(),
    items,
    size: size as Size,
    toppings,
    address,
    status: "pending",
    total,
  };

  orders.push(order);
  return order;
}

export function getOrder(id: string): Order | undefined {
  return orders.find(o => o.id === id);
}

export function listOrders(status?: string): Order[] {
  if (!status) return orders;
  return orders.filter(o => o.status === status);
}

export function cancelOrder(id: string): Order {
  const order = orders.find(o => o.id === id);
  if (!order) throw new Error("Order no encontrada");
  if (order.status === "delivered") throw new Error("No se puede cancelar una orden entregada");
  order.status = "canceled";
  return order;
}
