import { z } from "zod";
// types/order.ts
import type { Product } from "./product";

export const OrderItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(1),
  product: z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    description: z.string(),
    category: z.enum(["bebida", "comida", "postre"]),
    image: z.string().url().optional(),
  }),
});

export const OrderSchema = z.object({
  items: z.array(OrderItemSchema),
  total: z.number(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;

// Helper para crear un OrderItem desde un Product
export const createOrderItem = (product: Product, quantity: number = 1): OrderItem => {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity,
    product,
  };
};