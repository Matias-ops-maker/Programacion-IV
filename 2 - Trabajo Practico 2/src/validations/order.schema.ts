import { z } from 'zod';

export const orderItemSchema = z.object({
    name: z.string().min(1, 'El nombre del item es requerido'),
    quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
    price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
});

export const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, 'Debe haber al menos un item'),
    size: z.enum(['S', 'M', 'L'], { errorMap: () => ({ message: 'Size debe ser S, M o L' }) }),
    toppings: z.array(z.string()).max(5, 'No puede haber más de 5 toppings').optional().default([]),
    address: z.string().min(10, 'La dirección debe tener al menos 10 caracteres'),
});

// Schema para validar solo la data necesaria sin Express req/res
export const orderSchema = createOrderSchema;