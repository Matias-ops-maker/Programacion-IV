import { z } from "zod";

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.enum(["bebida", "comida", "postre"]),
  image: z.string().url().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
