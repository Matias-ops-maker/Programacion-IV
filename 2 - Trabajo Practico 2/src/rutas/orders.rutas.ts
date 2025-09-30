import { Router } from "express";
import { z } from "zod";
import { createOrder, getOrder, listOrders, cancelOrder } from "../services/orders.servicio";

const router = Router();

// Schemas
const createOrderSchema = z.object({
  items: z.array(z.object({ name: z.string(), quantity: z.number().min(1), price: z.number() })).min(1),
  size: z.enum(["S", "M", "L"]),
  toppings: z.array(z.string()).max(5).optional(),
  address: z.string().min(10),
});

// POST /orders
router.post("/", (req, res) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const order = createOrder(data);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(422).json({ error: err.message });
  }
});

// GET /orders/:id
router.get("/:id", (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order no encontrada" });
  res.json(order);
});

// GET /orders?status
router.get("/", (req, res) => {
  const orders = listOrders(req.query.status as string);
  res.json(orders);
});

// POST /orders/:id/cancel
router.post("/:id/cancel", (req, res) => {
  try {
    const order = cancelOrder(req.params.id);
    res.json(order);
  } catch (err: any) {
    res.status(409).json({ error: err.message });
  }
});

export default router;
