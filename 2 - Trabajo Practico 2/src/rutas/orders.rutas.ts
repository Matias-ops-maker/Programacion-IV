import { Router, Request, Response } from "express";
import { createOrder, getOrder, listOrders, cancelOrder } from "../services/orders.servicio";
import { createOrderSchema } from "../validations/order.schema";

const router = Router();

// POST /orders
router.post("/", (req: Request, res: Response) => {
  try {
    // Validar los datos de entrada con Zod
    const validatedData = createOrderSchema.parse(req.body);
    
    // Crear la orden usando el servicio
    const order = createOrder(validatedData);
    
    res.status(201).json(order);
  } catch (err: any) {
    // Si es un error de validación de Zod
    if (err.name === 'ZodError') {
      return res.status(422).json({ 
        error: "Datos de entrada inválidos", 
        details: err.errors 
      });
    }
    
    // Otros errores
    res.status(500).json({ 
      error: "Error interno del servidor",
      message: err.message 
    });
  }
});

// GET /orders/:id
router.get("/:id", (req: Request, res: Response) => {
  try {
    const order = getOrder(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: "Order no encontrada" });
    }
    
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ 
      error: "Error interno del servidor",
      message: err.message 
    });
  }
});

// GET /orders?status
router.get("/", (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const orders = listOrders(status);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ 
      error: "Error interno del servidor",
      message: err.message 
    });
  }
});

// POST /orders/:id/cancel
router.post("/:id/cancel", (req: Request, res: Response) => {
  try {
    const order = cancelOrder(req.params.id);
    res.json(order);
  } catch (err: any) {
    // Error específico de lógica de negocio
    if (err.message.includes("no encontrada")) {
      return res.status(404).json({ error: err.message });
    }
    
    if (err.message.includes("entregada")) {
      return res.status(409).json({ error: err.message });
    }
    
    // Otros errores
    res.status(500).json({ 
      error: "Error interno del servidor",
      message: err.message 
    });
  }
});

export default router;
