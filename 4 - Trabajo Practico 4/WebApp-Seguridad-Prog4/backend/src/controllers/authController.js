const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { failedAttempts } = require('../middleware/bruteForce');

const login = async (req, res) => {
  const ip = req.ip || "unknown";
  failedAttempts[ip] = failedAttempts[ip] || 0;

  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = ?`;

  db.query(query, [username], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    // Usuario no existe
    if (results.length === 0) {
      failedAttempts[ip]++;
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = results[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    // Contraseña incorrecta
    if (!isValidPassword) {
      failedAttempts[ip]++;
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Exito → resetear
    failedAttempts[ip] = 0;

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'supersecret123'
    );

    return res.json({ token, username: user.username });
  });
};

const register = (req, res) => {
  return res.status(501).json({ error: 'Not implemented' });
};

const verifyToken = (req, res) => {
  return res.status(501).json({ error: 'Not implemented' });
};

const checkUsername = (req, res) => {
  return res.status(501).json({ error: 'Not implemented' });
};

module.exports = {
  login,
  register,
  verifyToken,
  checkUsername
};
