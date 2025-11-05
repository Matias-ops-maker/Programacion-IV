import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { OrderProvider } from "../hooks/OrderContext";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";
import App from "../App";

describe("Integración completa del flujo de pedidos", () => {
  test("flujo completo: cargar menú -> agregar items -> calcular total -> enviar pedido -> resetear", async () => {
    render(
      <OrderProvider>
        <App />
      </OrderProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Café Americano")).toBeInTheDocument();
    });

    const agregarCafeBtn = screen.getByTestId("add-to-cart-1");
    const agregarMedialunaBtn = screen.getByTestId("add-to-cart-2");

    fireEvent.click(agregarCafeBtn);
    fireEvent.click(agregarMedialunaBtn);
    fireEvent.click(agregarCafeBtn);

    await waitFor(() => {
      expect(screen.getByTestId("order-total")).toHaveTextContent("$1300");
      expect(screen.getByTestId("quantity-1")).toHaveTextContent("2");
      expect(screen.getByTestId("quantity-2")).toHaveTextContent("1");
    });

    const enviarPedidoBtn = screen.getByText("Enviar pedido");
    fireEvent.click(enviarPedidoBtn);

    await waitFor(() => {
      expect(screen.getByText("¡Pedido confirmado!")).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(
          screen.getByText("No hay productos en tu pedido")
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test("manejo de errores en el flujo", async () => {
    server.use(
      http.get("/api/menu", () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(
      <OrderProvider>
        <App />
      </OrderProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Error al cargar el menú")).toBeInTheDocument();
    });
  });

  test("menú vacío", async () => {
    server.use(
      http.get("/api/menu", () => {
        return HttpResponse.json([]);
      })
    );

    render(
      <OrderProvider>
        <App />
      </OrderProvider>
    );
    await waitFor(() => {
      expect(
        screen.getByText(
          "Lo sentimos, no hay productos disponibles en este momento."
        )
      ).toBeInTheDocument();
    });
  });
});
