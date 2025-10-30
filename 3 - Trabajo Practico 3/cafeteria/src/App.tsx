import { OrderProvider } from './hooks/OrderContext';
import { Menu } from './components/Menu';
import { OrderSummary } from './components/OrderSummary';
import './App.css';

function App() {
  return (
    <OrderProvider>
      <div className="app">
        <header>
          <h1>Cafetería App</h1>
          <p>Bienvenido a nuestra cafetería virtual</p>
        </header>
        
        <main className="main-content">
          <div className="menu-section">
            <Menu />
          </div>
          
          <div className="order-section">
            <OrderSummary />
          </div>
        </main>
      </div>
    </OrderProvider>
  );
}

export default App;
