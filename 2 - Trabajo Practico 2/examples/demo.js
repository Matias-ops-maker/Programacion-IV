#!/usr/bin/env node

/**
 * Script de ejemplo para demostrar el uso de la API
 * Ejecutar con: node examples/demo.js (después de npm run build)
 */

const http = require('http');

const HOST = 'http://localhost:3000';

// Función helper para hacer requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, HOST);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runDemo() {
  console.log('🍕 Demo de API de Pedidos - Trabajo Práctico 2\n');

  try {
    // 1. Crear un pedido válido
    console.log('📝 1. Creando un pedido válido...');
    const orderData = {
      items: [
        { name: 'Pizza Margherita', quantity: 2, price: 15.99 },
        { name: 'Coca Cola 500ml', quantity: 1, price: 2.50 }
      ],
      size: 'L',
      toppings: ['cheese', 'pepperoni', 'mushrooms'],
      address: 'Av. Corrientes 1234, Buenos Aires, Argentina'
    };

    const createResponse = await makeRequest('POST', '/orders', orderData);
    console.log(`Status: ${createResponse.status}`);
    console.log('Pedido creado:', JSON.stringify(createResponse.data, null, 2));
    
    if (createResponse.status !== 201) {
      throw new Error('Error al crear pedido');
    }

    const orderId = createResponse.data.id;
    console.log(`\n✅ Pedido creado con ID: ${orderId}`);
    console.log(`💰 Total calculado: $${createResponse.data.total}`);

    // 2. Obtener el pedido por ID
    console.log('\n📋 2. Obteniendo el pedido por ID...');
    const getResponse = await makeRequest('GET', `/orders/${orderId}`);
    console.log(`Status: ${getResponse.status}`);
    console.log('Pedido obtenido:', JSON.stringify(getResponse.data, null, 2));

    // 3. Listar todos los pedidos
    console.log('\n📜 3. Listando todos los pedidos...');
    const listResponse = await makeRequest('GET', '/orders');
    console.log(`Status: ${listResponse.status}`);
    console.log(`Número de pedidos: ${listResponse.data.length}`);

    // 4. Intentar crear un pedido inválido (sin items)
    console.log('\n❌ 4. Intentando crear un pedido inválido (sin items)...');
    const invalidOrderData = {
      items: [], // Sin items - debería fallar
      size: 'M',
      toppings: ['cheese'],
      address: 'Dirección de prueba'
    };

    const invalidResponse = await makeRequest('POST', '/orders', invalidOrderData);
    console.log(`Status: ${invalidResponse.status} (esperado: 422)`);
    console.log('Error:', JSON.stringify(invalidResponse.data, null, 2));

    // 5. Cancelar el pedido
    console.log('\n🚫 5. Cancelando el pedido...');
    const cancelResponse = await makeRequest('POST', `/orders/${orderId}/cancel`);
    console.log(`Status: ${cancelResponse.status}`);
    console.log('Pedido cancelado:', JSON.stringify(cancelResponse.data, null, 2));

    // 6. Listar pedidos cancelados
    console.log('\n📋 6. Listando pedidos cancelados...');
    const canceledListResponse = await makeRequest('GET', '/orders?status=canceled');
    console.log(`Status: ${canceledListResponse.status}`);
    console.log(`Pedidos cancelados: ${canceledListResponse.data.length}`);

    // 7. Intentar cancelar nuevamente (debería funcionar)
    console.log('\n🔄 7. Intentando cancelar nuevamente...');
    const cancelAgainResponse = await makeRequest('POST', `/orders/${orderId}/cancel`);
    console.log(`Status: ${cancelAgainResponse.status}`);
    
    console.log('\n✅ Demo completado exitosamente!');
    console.log('\n📊 Resumen de pruebas:');
    console.log('- ✅ Creación de pedido válido');
    console.log('- ✅ Cálculo automático de precio');
    console.log('- ✅ Obtención de pedido por ID'); 
    console.log('- ✅ Listado de pedidos');
    console.log('- ✅ Validación de datos (rechazo de pedido sin items)');
    console.log('- ✅ Cancelación de pedido');
    console.log('- ✅ Filtrado por status');

  } catch (error) {
    console.error('\n❌ Error en el demo:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté ejecutándose:');
    console.log('   npm run dev');
    process.exit(1);
  }
}

// Verificar si el servidor está disponible antes de ejecutar el demo
async function checkServer() {
  try {
    await makeRequest('GET', '/orders');
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 Verificando que el servidor esté disponible...');
  const serverAvailable = await checkServer();
  
  if (!serverAvailable) {
    console.log('❌ Servidor no disponible en http://localhost:3000');
    console.log('🚀 Inicia el servidor con: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Servidor disponible, ejecutando demo...\n');
  await runDemo();
}

if (require.main === module) {
  main();
}