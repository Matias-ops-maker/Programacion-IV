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

  http.post("/api/orders", async ({ request }) => {
    const order = (await request.json()) as { items: Product[]; total: number };
    return HttpResponse.json(
      {
        id: Math.floor(Math.random() * 1000),
        ...order,
        status: "confirmed",
      },
      { status: 200 }
    );
  }),
];
