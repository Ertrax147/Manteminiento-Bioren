import express from 'express';
import pool from '../db';

const router = express.Router();

// Obtener notificaciones no leídas 
router.get('/', async (req, res) => {
  try {
    const [notifications] = await pool.query(`
      SELECT id, message, created_at, equipmentId, type  
      FROM notifications 
      WHERE is_read = false 
      ORDER BY created_at DESC
      LIMIT 5  
    `);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// Marcar como leída al hacer clic
router.post('/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
});

export default router;