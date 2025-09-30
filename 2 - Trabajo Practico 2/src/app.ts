import express from "express";
import ordersRoutes from "./rutas/orders.rutas";

export function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/orders", ordersRoutes);
  app.get("/", (req, res) => {
  res.send("API Funcionando ");
});
  return app;
}
