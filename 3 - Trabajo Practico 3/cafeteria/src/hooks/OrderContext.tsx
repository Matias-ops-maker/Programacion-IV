import React, { createContext, useReducer, type ReactNode } from 'react';
import type { OrderItem } from '../types/order';
import { createOrderItem } from '../types/order';
import type { Product } from '../types/product';

interface OrderState {
  items: OrderItem[];
  total: number;
}

interface OrderContextType extends OrderState {
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearOrder: () => void;
  getTotal: () => number;
}

type OrderAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'CLEAR_ORDER' };

const calculateTotal = (items: OrderItem[]): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

const orderReducer = (state: OrderState, action: OrderAction): OrderState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === product.id);
      
      let newItems: OrderItem[];
      
      if (existingItemIndex >= 0) {
        // Si el item ya existe, incrementar la cantidad
        newItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Si es un nuevo item, agregarlo
        const newItem = createOrderItem(product, quantity);
        newItems = [...state.items, newItem];
      }
      
      return {
        items: newItems,
        total: calculateTotal(newItems),
      };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload.productId);
      return {
        items: newItems,
        total: calculateTotal(newItems),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Si la cantidad es 0 o negativa, eliminar el item
        const newItems = state.items.filter(item => item.id !== productId);
        return {
          items: newItems,
          total: calculateTotal(newItems),
        };
      }
      
      const newItems = state.items.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      
      return {
        items: newItems,
        total: calculateTotal(newItems),
      };
    }
    
    case 'CLEAR_ORDER':
      return {
        items: [],
        total: 0,
      };
    
    default:
      return state;
  }
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export { OrderContext };

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }: OrderProviderProps) => {
  const [state, dispatch] = useReducer(orderReducer, {
    items: [],
    total: 0,
  });

  const addItem = (product: Product, quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };

  const removeItem = (productId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearOrder = () => {
    dispatch({ type: 'CLEAR_ORDER' });
  };

  const getTotal = () => state.total;

  const contextValue: OrderContextType = {
    items: state.items,
    total: state.total,
    addItem,
    removeItem,
    updateQuantity,
    clearOrder,
    getTotal,
  };

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};