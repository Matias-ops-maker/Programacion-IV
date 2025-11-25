const { db } = require('../config/database');

// Safe implementation that uses parameterized queries and input validation
const getProducts = (req, res) => {
  const { category, search } = req.query;

  // Validación básica de entrada
  if (category && typeof category !== 'string') {
    return res.status(400).json({ error: 'Invalid category format' });
  }
  if (search && typeof search !== 'string') {
    return res.status(400).json({ error: 'Invalid search format' });
  }

  // Limitar longitudes para evitar payloads excesivamente largos
  if (category && category.length > 100) return res.status(400).json({ error: 'Category too long' });
  if (search && search.length > 100) return res.status(400).json({ error: 'Search too long' });

  // ENDURECER: detectar patrones SQL sospechosos en `category` y devolver array vacío
  // (esto evita que payloads con comentarios, UNION, information_schema, DROP, etc. sean procesados)
  const isSuspiciousCategory = (input) => {
    if (!input || typeof input !== 'string') return false;
    const suspiciousPatterns = [
      /--/,           // comment
      /\/\*/,        // block comment start
      /#/,            // mysql comment
      /;/,            // statement separator
      /\bUNION\b/i,
      /\bSELECT\b/i,
      /\bINFORMATION_SCHEMA\b/i,
      /\bDROP\b/i,
      /\bDELETE\b/i,
      /\bINSERT\b/i,
      /\bUPDATE\b/i,
      /\bTABLE\b/i,
      /\bSLEEP\b/i,
      /\bBENCHMARK\b/i,
      /\b1\s*=\s*1\b/, // tautology
      /\bOR\b\s*\d+\s*=\s*\d+/i // things like OR 1=1
    ];

    return suspiciousPatterns.some((re) => re.test(input));
  };

  if (category && isSuspiciousCategory(category)) {
    console.warn('Rejecting suspicious category input:', category);
    // Devolver respuesta segura: array vacío, status 200 (los tests educativos esperan esto)
    return res.status(200).json([]);
  }

  // Construir consulta usando placeholders para prevenir SQL injection
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      // No exponer detalles SQL al cliente
      console.error('DB error in getProducts:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
};

module.exports = {
  getProducts
};

// Endpoint seguro para obtener un producto por ID (protección contra blind SQLi y validación numérica)
const getProductById = (req, res) => {
  const idParam = req.params && req.params.id;

  // Validación estricta: sólo enteros positivos
  const id = Number(idParam);
  if (!idParam || Number.isNaN(id) || !Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  const query = 'SELECT * FROM products WHERE id = ? LIMIT 1';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('DB error in getProductById:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(results[0]);
  });
};

module.exports.getProductById = getProductById;
