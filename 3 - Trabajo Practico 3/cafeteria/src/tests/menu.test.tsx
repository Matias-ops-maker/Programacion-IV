/// &lt;reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Menu } from '../components/Menu';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import '@testing-library/jest-dom/vitest';

describe('Menu Component', () => {
  it('debería renderizar los productos del menú', async () => {
    render(<Menu />);
    
    const productos = await screen.findAllByRole('listitem');
    
    expect(productos).toHaveLength(3);

    expect(screen.getByText('Café Americano')).toBeInTheDocument();
    expect(screen.getByText('Medialuna')).toBeInTheDocument();
    expect(screen.getByText('Tiramisú')).toBeInTheDocument();
    
    expect(screen.getByText('Café negro suave y aromático')).toBeInTheDocument();
    expect(screen.getByText('Medialuna de mantequilla recién horneada')).toBeInTheDocument();
    expect(screen.getByText('Postre italiano tradicional')).toBeInTheDocument();

    expect(screen.getByText('Precio: $500')).toBeInTheDocument();
    expect(screen.getByText('Precio: $300')).toBeInTheDocument();
    expect(screen.getByText('Precio: $450')).toBeInTheDocument();
  });

  it('debería mostrar un error si la carga falla', async () => {
    server.use(
      http.get('/api/menu', () => {
        return new HttpResponse(null, { 
          status: 500,
          statusText: 'Internal Server Error'
        });
      })
    );

    render(<Menu />);
    
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent('Error al cargar el menú');
  });
});
