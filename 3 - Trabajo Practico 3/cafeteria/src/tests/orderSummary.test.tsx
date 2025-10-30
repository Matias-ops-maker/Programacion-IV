/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { OrderProvider } from '../hooks/OrderContext';
import { useOrder } from '../hooks/useOrder';
import { OrderSummary } from '../components/OrderSummary';
import type { Product } from '../types/product';
import '@testing-library/jest-dom/vitest';

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Café Americano',
    description: 'Café negro suave y aromático',
    price: 500,
    category: 'bebida'
  },
  {
    id: 2,
    name: 'Medialuna',
    description: 'Medialuna de mantequilla recién horneada',
    price: 300,
    category: 'comida'
  },
  {
    id: 3,
    name: 'Tiramisú',
    description: 'Postre italiano tradicional',
    price: 450,
    category: 'postre'
  }
];

// Componente helper para setup inicial con items
const OrderSummaryWithInitialItems = ({ products }: { products: { product: Product; quantity: number }[] }) => {
  const { addItem } = useOrder();
  
  React.useEffect(() => {
    products.forEach(({ product, quantity }) => {
      addItem(product, quantity);
    });
  }, [addItem, products]);

  return <OrderSummary />;
};

describe('OrderSummary Component', () => {
  it('debería mostrar mensaje de pedido vacío cuando no hay items', () => {
    render(
      <OrderProvider>
        <OrderSummary />
      </OrderProvider>
    );

    expect(screen.getByTestId('order-summary')).toBeInTheDocument();
    expect(screen.getByText('Tu pedido')).toBeInTheDocument();
    expect(screen.getByText('No hay productos en tu pedido')).toBeInTheDocument();
  });

  it('debería renderizar items del pedido correctamente', async () => {
    const initialProducts = [{ product: mockProducts[0], quantity: 1 }];
    
    render(
      <OrderProvider>
        <OrderSummaryWithInitialItems products={initialProducts} />
      </OrderProvider>
    );

    // Esperar a que el item aparezca en el DOM
    const item = await screen.findByTestId('order-item-1');
    expect(item).toBeInTheDocument();
    expect(screen.getByText('Café Americano')).toBeInTheDocument();
    expect(screen.getByText('$500')).toBeInTheDocument();
  });

  it('debería mostrar el total correctamente', async () => {
    const initialProducts = [{ product: mockProducts[0], quantity: 1 }];
    
    render(
      <OrderProvider>
        <OrderSummaryWithInitialItems products={initialProducts} />
      </OrderProvider>
    );

    // Esperar a que el total aparezca
    await screen.findByTestId('order-total');
    expect(screen.getByTestId('order-total')).toBeInTheDocument();
  });

  it('debería permitir eliminar items individualmente', async () => {
    const initialProducts = [{ product: mockProducts[0], quantity: 1 }];
    
    render(
      <OrderProvider>
        <OrderSummaryWithInitialItems products={initialProducts} />
      </OrderProvider>
    );

    // Esperar a que el item esté presente
    await screen.findByTestId('order-item-1');
    const removeButton = screen.getByTestId('remove-1');
    fireEvent.click(removeButton);
    await waitFor(() => expect(screen.queryByTestId('order-item-1')).not.toBeInTheDocument());
  });

  it('debería permitir aumentar la cantidad de items', async () => {
    const initialProducts = [{ product: mockProducts[0], quantity: 1 }];
    
    render(
      <OrderProvider>
        <OrderSummaryWithInitialItems products={initialProducts} />
      </OrderProvider>
    );

    await screen.findByTestId('order-item-1');
    const increaseButton = screen.getByTestId('increase-1');
    fireEvent.click(increaseButton);
    await waitFor(() => expect(screen.getByTestId('quantity-1')).toHaveTextContent('2'));
  });

  it('debería permitir disminuir la cantidad de items', async () => {
    const initialProducts = [{ product: mockProducts[0], quantity: 2 }];
    
    render(
      <OrderProvider>
        <OrderSummaryWithInitialItems products={initialProducts} />
      </OrderProvider>
    );

    await screen.findByTestId('order-item-1');
    const decreaseButton = screen.getByTestId('decrease-1');
    fireEvent.click(decreaseButton);
    await waitFor(() => expect(screen.getByTestId('quantity-1')).toHaveTextContent('1'));
  });

  it('debería deshabilitar el botón de disminuir cuando la cantidad es 1', async () => {
    const initialProducts = [{ product: mockProducts[0], quantity: 1 }];
    
    render(
      <OrderProvider>
        <OrderSummaryWithInitialItems products={initialProducts} />
      </OrderProvider>
    );

    await screen.findByTestId('order-item-1');
    const decreaseButton = screen.getByTestId('decrease-1');
    expect(decreaseButton).toBeDisabled();
  });

  it('debería permitir limpiar todo el pedido', async () => {
    const initialProducts = [{ product: mockProducts[0], quantity: 1 }];
    
    render(
      <OrderProvider>
        <OrderSummaryWithInitialItems products={initialProducts} />
      </OrderProvider>
    );

    await screen.findByTestId('order-item-1');
    const clearButton = screen.getByTestId('clear-order');
    fireEvent.click(clearButton);
    await waitFor(() => expect(screen.getByText('No hay productos en tu pedido')).toBeInTheDocument());
  });

  it('debería calcular el total correctamente con múltiples items', async () => {
    const initialProducts = [
      { product: mockProducts[0], quantity: 1 }, // Café: $500
      { product: mockProducts[1], quantity: 2 }  // Medialuna: $300 x 2 = $600
    ];
    
    render(
      <OrderProvider>
        <OrderSummaryWithInitialItems products={initialProducts} />
      </OrderProvider>
    );

    // Esperar a que los items se agreguen y el total se calcule
    await screen.findByTestId('order-total');
    expect(screen.getByText('Total: $1100.00')).toBeInTheDocument();
  });
});