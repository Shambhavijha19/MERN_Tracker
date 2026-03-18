const bcrypt = require('bcryptjs');
const { getMySQLPool } = require('../config/mysql');

const mapRowToProfile = (row) => ({
    id: String(row.id),
    name: row.name,
    email: row.email,
    avatar: row.avatar || '',
    role: row.role || 'user',
    isEmailVerified: Boolean(row.is_email_verified),
    currency: row.currency || 'INR',
    createdAt: row.created_at
});

const mapRowToAuthUser = (row) => ({
    ...mapRowToProfile(row),
    passwordHash: row.password_hash,
    lastLogin: row.last_login
});

const findByEmail = async (email) => {
    const pool = getMySQLPool();
    const [rows] = await pool.execute(
        `SELECT id, name, email, password_hash, avatar, role, is_email_verified, currency, last_login, created_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
        [email.toLowerCase()]
    );

    if (rows.length === 0) return null;
    return mapRowToAuthUser(rows[0]);
};

const findById = async (id) => {
    const pool = getMySQLPool();
    const [rows] = await pool.execute(
        `SELECT id, name, email, avatar, role, is_email_verified, currency, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
        [id]
    );

    if (rows.length === 0) return null;
    return mapRowToProfile(rows[0]);
};

const createUser = async ({ name, email, password, currency = 'INR' }) => {
    const pool = getMySQLPool();
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
        `INSERT INTO users (name, email, password_hash, currency, is_email_verified)
     VALUES (?, ?, ?, ?, TRUE)`,
        [name, email.toLowerCase(), passwordHash, currency]
    );

    return findById(result.insertId);
};

const updateLastLogin = async (id) => {
    const pool = getMySQLPool();
    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
};

const updateProfile = async (id, updates) => {
    const pool = getMySQLPool();
    const fields = [];
    const values = [];

    if (updates.name) {
        fields.push('name = ?');
        values.push(updates.name);
    }

    if (updates.currency) {
        fields.push('currency = ?');
        values.push(updates.currency.toUpperCase());
    }

    if (fields.length > 0) {
        values.push(id);
        await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return findById(id);
};

const updatePassword = async (id, newPassword) => {
    const pool = getMySQLPool();
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
};

module.exports = {
    findByEmail,
    findById,
    createUser,
    updateLastLogin,
    updateProfile,
    updatePassword,
    comparePassword: bcrypt.compare
};
