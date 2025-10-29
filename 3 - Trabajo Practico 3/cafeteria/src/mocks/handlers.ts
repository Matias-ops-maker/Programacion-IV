import { http, HttpResponse } from "msw";
import type { Product } from "../types/product";

const mockProducts: Product[] = [
  {
    id: 1,
    name: "Café Americano",
    price: 500,
    description: "Café negro suave y aromático",
    category: "bebida",
  },
  {
    id: 2,
    name: "Medialuna",
    price: 300,
    description: "Medialuna de mantequilla recién horneada",
    category: "comida",
  },
  {
    id: 3,
    name: "Tiramisú",
    price: 450,
    description: "Postre italiano tradicional",
    category: "postre",
  },
];

export const handlers = [
  http.get("/api/menu", () => {
    return HttpResponse.json(mockProducts);
  }),

  http.get("/api/orders", () => {
    return HttpResponse.json([{ id: 101, items: ["Café"], total: 500 }]);
  }),
];
