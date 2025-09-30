import { Request, Response } from "express";
import { Order, Size } from "../types/order";
import { v4 as uuidv4 } from "uuid";
import { orderSchema } from "../validations/order.schema";

const orders: Order[] = [];

export function createOrder(req: Request, res: Response) {
  const result = orderSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({ error: result.error.errors });
  }

  const { items, size, toppings = [], address } = result.data;
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
  return res.status(201).json(order);
}

export function getOrder(id: string): Order | undefined {
  return orders.find(o => o.id === id);
}

export function listOrders(status?: string): Order[] {
  if (!status) return orders;
  return orders.filter(o => o.status === status);
}

export function cancelOrder(req: Request, res: Response) {
  const id = req.params.id;
  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Order no encontrada" });
  }
  if (order.status === "delivered") {
    return res.status(409).json({ error: "No se puede cancelar una orden entregada" });
  }
  order.status = "canceled";
  return res.status(200).json(order);
}