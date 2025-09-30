import express from 'express';
import ordersRouter from './rutas/orders.rutas';

export function makeApp() {
    const app = express();
    app.use(express.json());
    app.use('/orders', ordersRouter);
    return app;
}