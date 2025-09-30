export type Size = "S" | "M" | "L";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  size: Size;
  toppings?: string[];
  address: string;
  status: "pending" | "delivered" | "canceled";
  total: number;
}
