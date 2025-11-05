import { useEffect, useState } from "react";
import type { Product } from "../types/product";
import { ProductSchema } from "../types/product";
import { useOrder } from "../hooks/useOrder";

export const Menu = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string>("");
  const { addItem } = useOrder();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/menu");

        if (!response.ok) {
          throw new Error("Error al cargar el menú");
        }

        const data = await response.json();

        const validatedProducts = data.map((product: unknown) => {
          const result = ProductSchema.safeParse(product);
          if (!result.success) {
            throw new Error("Datos de producto inválidos");
          }
          return result.data;
        });

        setProducts(validatedProducts);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el menú"
        );
      }
    };

    fetchProducts();
  }, []);

  if (error) {
    return (
      <div role="alert" className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
          data-testid="retry-button"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div role="alert" className="empty-menu">
        <h2>Menú no disponible</h2>
        <p>Lo sentimos, no hay productos disponibles en este momento.</p>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
          data-testid="retry-button"
        >
          Actualizar Menú
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Nuestro Menú</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id} role="listitem">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
              }}
            >
              <div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p>Precio: ${product.price}</p>
                <p>Categoría: {product.category}</p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addItem(product);
                }}
                data-testid={`add-to-cart-${product.id}`}
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Agregar al Pedido
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
