# Matriz de Casos de Prueba - TP2: API REST Pedidos

## Tests Unitarios

| ID | Caso / Descripción | Precondición | Input | Acción | Resultado esperado | Test |
|---|---|---|---|---|---|---|
| **CA1** | Calcular precio base tamaño S | Ninguna | size = 'S' | calculateBasePrice('S') | 100 | ✅ |
| **CA2** | Calcular precio base tamaño M | Ninguna | size = 'M' | calculateBasePrice('M') | 150 | ✅ |
| **CA3** | Calcular precio base tamaño L | Ninguna | size = 'L' | calculateBasePrice('L') | 200 | ✅ |
| **CA4** | Calcular precio toppings vacío | Ninguna | toppings = [] | calculateToppingsPrice([]) | 0 | ✅ |
| **CA5** | Calcular precio 1 topping | Ninguna | toppings = ['cheese'] | calculateToppingsPrice(['cheese']) | 20 | ✅ |
| **CA6** | Calcular precio 2 toppings | Ninguna | toppings = ['cheese', 'pepperoni'] | calculateToppingsPrice(['cheese', 'pepperoni']) | 40 | ✅ |
| **CA7** | Calcular precio 5 toppings | Ninguna | toppings = ['cheese', 'pepperoni', 'mushrooms', 'olives', 'ham'] | calculateToppingsPrice([...]) | 100 | ✅ |
| **CA8** | Calcular precio total de items | Ninguna | items = [{name: 'Pizza', quantity: 2, price: 15.99}, {name: 'Coca', quantity: 1, price: 2.50}] | calculateItemsPrice(items) | 34.48 | ✅ |
| **CA9** | Calcular precio total completo | Ninguna | items, size='M', toppings=['cheese','pepperoni'] | calculateTotalPrice(...) | 205.99 (15.99 + 150 + 40) | ✅ |
| **CA10** | Crear orden válida | Ninguna | items, size='L', toppings=['cheese'], address='Calle Falsa 123...' | createNewOrder(...) | Orden con id, status='pending', total=235.99 | ✅ |
| **CA11** | Verificar cancelación orden pendiente | Orden con status='pending' | order.status = 'pending' | canCancelOrder(order) | true | ✅ |
| **CA12** | Verificar cancelación orden entregada | Orden con status='delivered' | order.status = 'delivered' | canCancelOrder(order) | false | ✅ |
| **CA13** | Cancelar orden válida | Orden con status='pending' | order.status = 'pending' | cancelOrderLogic(order) | Orden con status='canceled' | ✅ |
| **ERR1** | Cancelar orden entregada | Orden con status='delivered' | order.status = 'delivered' | cancelOrderLogic(order) | Error: 'No se puede cancelar una orden entregada' | ✅ |
| **CA14** | Validar toppings vacío | Ninguna | toppings = [] | validateToppings([]) | true | ✅ |
| **CA15** | Validar 1 topping | Ninguna | toppings = ['cheese'] | validateToppings(['cheese']) | true | ✅ |
| **CA16** | Validar 5 toppings (máximo) | Ninguna | toppings = ['1','2','3','4','5'] | validateToppings([...]) | true | ✅ |
| **ERR2** | Validar más de 5 toppings | Ninguna | toppings = ['1','2','3','4','5','6'] | validateToppings([...]) | false | ✅ |
| **CA17** | Validar items válidos | Ninguna | items = [{name:'Pizza', quantity:1, price:10}, {name:'Drink', quantity:2, price:5}] | validateItems(items) | true | ✅ |
| **ERR3** | Validar items vacío | Ninguna | items = [] | validateItems([]) | false | ✅ |
| **ERR4** | Validar items con nombre vacío | Ninguna | items = [{name:'', quantity:1, price:10}] | validateItems(items) | false | ✅ |
| **ERR5** | Validar items con cantidad cero | Ninguna | items = [{name:'Valid', quantity:0, price:5}] | validateItems(items) | false | ✅ |

---

## Tests de Integración

| ID | Caso / Descripción | Precondición | Input | Acción | Resultado esperado | Test |
|---|---|---|---|---|---|---|
| **INT1** | Crear orden válida | Servidor corriendo | POST /orders con body válido: items, size='M', toppings, address | POST /orders | Status 201, orden creada con id, status='pending', total calculado | ✅ |
| **INT-ERR1** | Crear orden sin items | Servidor corriendo | POST /orders con items = [] | POST /orders | Status 422, error: 'Datos de entrada inválidos' | ✅ |
| **INT-ERR2** | Crear orden con más de 5 toppings | Servidor corriendo | POST /orders con 6 toppings | POST /orders | Status 422, error: 'Datos de entrada inválidos' | ✅ |
| **INT-ERR3** | Crear orden con dirección corta | Servidor corriendo | POST /orders con address='Short' (< 10 caracteres) | POST /orders | Status 422, error presente | ✅ |
| **INT-ERR4** | Crear orden con size inválido | Servidor corriendo | POST /orders con size='XL' | POST /orders | Status 422, error presente | ✅ |
| **INT2** | Obtener orden existente | Orden creada previamente | GET /orders/:id con id válido | GET /orders/:id | Status 200, orden con datos correctos | ✅ |
| **INT-ERR5** | Obtener orden inexistente | Servidor corriendo | GET /orders/non-existing-id | GET /orders/:id | Status 404, error: 'Order no encontrada' | ✅ |
| **INT3** | Listar todas las órdenes | 2+ órdenes creadas | GET /orders | GET /orders | Status 200, array con todas las órdenes | ✅ |
| **INT4** | Filtrar órdenes por status | Orden cancelada creada | GET /orders?status=canceled | GET /orders | Status 200, array con órdenes filtradas por status | ✅ |
| **INT5** | Cancelar orden pendiente | Orden pendiente creada | POST /orders/:id/cancel con id válido | POST /orders/:id/cancel | Status 200, orden con status='canceled' | ✅ |
| **INT-ERR6** | Cancelar orden inexistente | Servidor corriendo | POST /orders/non-existing-id/cancel | POST /orders/:id/cancel | Status 404, error: 'Order no encontrada' | ✅ |
| **INT-ERR7** | Cancelar orden entregada | Orden con status='delivered' | POST /orders/:id/cancel con orden delivered | POST /orders/:id/cancel | Status 409, error: 'No se puede cancelar una orden entregada' | ✅ |

---

## Resumen de Casos

### Por Categoría
- **Cálculos de Precio**: 9 casos (CA1-CA9)
- **Lógica de Negocio**: 5 casos (CA10-CA13, ERR1)
- **Validaciones**: 8 casos (CA14-CA17, ERR2-ERR5)
- **Integración API**: 12 casos (INT1-INT5, INT-ERR1-INT-ERR7)

### Por Resultado
- **Casos de éxito**: 22 casos
- **Casos de error**: 12 casos
- **Total**: 34 casos de prueba

### Códigos HTTP Validados
- ✅ **200**: Operación exitosa (GET, cancelación)
- ✅ **201**: Recurso creado
- ✅ **404**: Recurso no encontrado
- ✅ **409**: Conflicto (cancelar orden entregada)
- ✅ **422**: Datos de entrada inválidos
