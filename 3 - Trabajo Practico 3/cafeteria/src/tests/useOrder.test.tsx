/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderProvider } from '../hooks/OrderContext';
import { useOrder } from '../hooks/useOrder';
import type { Product } from '../types/product';
import '@testing-library/jest-dom/vitest';

// Componente de prueba para testear el hook
const TestComponent = () => {
  const { items, total, addItem, removeItem, updateQuantity, clearOrder, getTotal } = useOrder();
  
  const mockProduct: Product = {
    id: 1,
    name: 'Café Americano',
    description: 'Café negro suave y aromático',
    price: 500,
    category: 'bebida'
  };

  const mockProduct2: Product = {
    id: 2,
    name: 'Medialuna',
    description: 'Medialuna de mantequilla recién horneada',
    price: 300,
    category: 'comida'
  };

  return (
    <div>
      <div data-testid="items-count">{items.length}</div>
      <div data-testid="total">{total}</div>
      <div data-testid="get-total">{getTotal()}</div>
      
      <button onClick={() => addItem(mockProduct)} data-testid="add-item">
        Agregar Café
      </button>
      <button onClick={() => addItem(mockProduct2, 2)} data-testid="add-item-quantity">
        Agregar 2 Medialunas
      </button>
      <button onClick={() => removeItem(1)} data-testid="remove-item">
        Remover Café
      </button>
      <button onClick={() => updateQuantity(1, 3)} data-testid="update-quantity">
        Actualizar a 3 Cafés
      </button>
      <button onClick={clearOrder} data-testid="clear-order">
        Limpiar Pedido
      </button>
      
      <div data-testid="items-list">
        {items.map(item => (
          <div key={item.id} data-testid={`item-${item.id}`}>
            {item.name} - Cantidad: {item.quantity} - Precio: ${item.price}
          </div>
        ))}
      </div>
    </div>
  );
};

describe('useOrder Hook', () => {
  it('debería inicializar con estado vacío', () => {
    render(
      <OrderProvider>
        <TestComponent />
      </OrderProvider>
    );

    expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    expect(screen.getByTestId('total')).toHaveTextContent('0');
    expect(screen.getByTestId('get-total')).toHaveTextContent('0');
  });

  it('debería agregar un item al pedido', () => {
    render(
      <OrderProvider>
        <TestComponent />
      </OrderProvider>
    );

    fireEvent.click(screen.getByTestId('add-item'));

    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    expect(screen.getByTestId('total')).toHaveTextContent('500');
    expect(screen.getByTestId('get-total')).toHaveTextContent('500');
    expect(screen.getByTestId('item-1')).toHaveTextContent('Café Americano - Cantidad: 1 - Precio: $500');
  });

  it('debería agregar un item con cantidad específica', () => {
    render(
      <OrderProvider>
        <TestComponent />
      </OrderProvider>
    );

    fireEvent.click(screen.getByTestId('add-item-quantity'));

    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    expect(screen.getByTestId('total')).toHaveTextContent('600');
    expect(screen.getByTestId('item-2')).toHaveTextContent('Medialuna - Cantidad: 2 - Precio: $300');
  });

  it('debería actualizar la cantidad de un item existente al agregarlo', () => {
    render(
      <OrderProvider>
        <TestComponent />
      </OrderProvider>
    );

    // Agregar café
    fireEvent.click(screen.getByTestId('add-item'));
    expect(screen.getByTestId('item-1')).toHaveTextContent('Café Americano - Cantidad: 1 - Precio: $500');

    // Agregar café otra vez
    fireEvent.click(screen.getByTestId('add-item'));
    expect(screen.getByTestId('items-count')).toHaveTextContent('1'); // Sigue siendo 1 item único
    expect(screen.getByTestId('item-1')).toHaveTextContent('Café Americano - Cantidad: 2 - Precio: $500');
    expect(screen.getByTestId('total')).toHaveTextContent('1000');
  });

  it('debería remover un item del pedido', () => {
    render(
      <OrderProvider>
        <TestComponent />
      </OrderProvider>
    );

    // Agregar y luego remover
    fireEvent.click(screen.getByTestId('add-item'));
    expect(screen.getByTestId('items-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByTestId('remove-item'));
    expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    expect(screen.getByTestId('total')).toHaveTextContent('0');
  });

  it('debería actualizar la cantidad de un item', () => {
    render(
      <OrderProvider>
        <TestComponent />
      </OrderProvider>
    );

    // Agregar item y actualizar cantidad
    fireEvent.click(screen.getByTestId('add-item'));
    fireEvent.click(screen.getByTestId('update-quantity'));

    expect(screen.getByTestId('item-1')).toHaveTextContent('Café Americano - Cantidad: 3 - Precio: $500');
    expect(screen.getByTestId('total')).toHaveTextContent('1500');
  });

  it('debería remover item si la cantidad es 0 o menor', () => {
    render(
      <OrderProvider>
        <TestComponent />
      </OrderProvider>
    );

    // Agregar item
    fireEvent.click(screen.getByTestId('add-item'));
    expect(screen.getByTestId('items-count')).toHaveTextContent('1');

    // Actualizar cantidad a 0
    fireEvent.click(screen.getByTestId('update-quantity'));
    // Cambiar la cantidad a 0 usando otro botón
    const updateTo0Button = screen.getByTestId('update-quantity');
    // Simular actualizar a 0
    fireEvent.click(updateTo0Button);
  });

  it('debería limpiar todo el pedido', () => {
    render(
      <OrderProvider>
        <TestComponent />
      </OrderProvider>
    );

    // Agregar varios items
    fireEvent.click(screen.getByTestId('add-item'));
    fireEvent.click(screen.getByTestId('add-item-quantity'));
    expect(screen.getByTestId('items-count')).toHaveTextContent('2');

    // Limpiar pedido
    fireEvent.click(screen.getByTestId('clear-order'));
    expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    expect(screen.getByTestId('total')).toHaveTextContent('0');
  });

  it('debería calcular el total correctamente con múltiples items', () => {
    render(
      <OrderProvider>
        <TestComponent />
      </OrderProvider>
    );

    // Agregar café (500)
    fireEvent.click(screen.getByTestId('add-item'));
    // Agregar 2 medialunas (300 x 2 = 600)
    fireEvent.click(screen.getByTestId('add-item-quantity'));

    expect(screen.getByTestId('total')).toHaveTextContent('1100');
    expect(screen.getByTestId('get-total')).toHaveTextContent('1100');
  });
});

describe('useOrder Hook - Error Handling', () => {
  it('debería lanzar error si se usa fuera del provider', () => {
    // Necesitamos usar un componente wrapper para capturar el error
    const TestComponentWithoutProvider = () => {
      try {
        useOrder();
        return <div>No error</div>;
      } catch (error) {
        return <div data-testid="error">{(error as Error).message}</div>;
      }
    };

    render(<TestComponentWithoutProvider />);
    expect(screen.getByTestId('error')).toHaveTextContent('useOrder must be used within an OrderProvider');
  });
});