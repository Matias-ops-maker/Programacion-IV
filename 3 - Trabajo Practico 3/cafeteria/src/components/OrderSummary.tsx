import React from 'react';
import { useOrder } from '../hooks/useOrder';

export const OrderSummary: React.FC = () => {
  const { items, total, removeItem, updateQuantity, clearOrder } = useOrder();

  if (items.length === 0) {
    return (
      <div className="order-summary" data-testid="order-summary">
        <h2>Tu pedido</h2>
        <p className="empty-order">No hay productos en tu pedido</p>
      </div>
    );
  }

  return (
    <div className="order-summary" data-testid="order-summary">
      <h2>Tu pedido</h2>
      
      <div className="order-items">
        {items.map((item) => (
          <div key={item.id} className="order-item" data-testid={`order-item-${item.id}`}>
            <div className="item-info">
              <h4>{item.name}</h4>
              <p className="item-price">${item.price}</p>
            </div>
            
            <div className="item-controls">
              <div className="quantity-controls">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  data-testid={`decrease-${item.id}`}
                  aria-label={`Disminuir cantidad de ${item.name}`}
                >
                  -
                </button>
                <span className="quantity" data-testid={`quantity-${item.id}`}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  data-testid={`increase-${item.id}`}
                  aria-label={`Aumentar cantidad de ${item.name}`}
                >
                  +
                </button>
              </div>
              
              <button
                onClick={() => removeItem(item.id)}
                className="remove-item"
                data-testid={`remove-${item.id}`}
                aria-label={`Eliminar ${item.name} del pedido`}
              >
                Eliminar
              </button>
            </div>
            
            <div className="item-total">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="order-total" data-testid="order-total">
        <h3>Total: ${total.toFixed(2)}</h3>
      </div>
      
      <div className="order-actions">
        <button
          onClick={clearOrder}
          className="clear-order"
          data-testid="clear-order"
        >
          Limpiar pedido
        </button>
      </div>
    </div>
  );
};