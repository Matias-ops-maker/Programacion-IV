import { z } from 'zod';

export const orderSchema = z.object({
    items: z.array(z.string()).min(1, 'Debe haber al menos un item'),
    size: z.enum(['S', 'M', 'L'], { errorMap: () => ({ message: 'Size inválido' }) }),
    toppings: z.array(z.string()).max(5, 'No puede haber más de 5 toppings'),
    address: z.string().min(10, 'Address mínimo 10 caracteres'),
});