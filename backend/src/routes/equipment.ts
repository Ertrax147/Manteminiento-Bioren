// backend/src/routes/equipment.ts

import { Router, Request, Response } from 'express';
import pool from '../db';
import { Equipment } from '../types';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Importamos el módulo 'fs' para manejar el sistema de archivos
import { differenceInDays } from 'date-fns';

// --- INICIO DE LA CONFIGURACIÓN CORREGIDA ---

const uploadDir = 'uploads/';
// Esta línea es clave: se asegura de que la carpeta 'uploads' exista antes de que multer intente usarla.
fs.mkdirSync(uploadDir, { recursive: true });

// Configuración de Multer para definir dónde y cómo guardar los archivos.
const storage = multer.diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- FIN DE LA CONFIGURACIÓN ---

const router = Router();

// --- RUTAS EXISTENTES PARA EQUIPOS (CRUD) ---

// GET /api/equipment
router.get('/', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query("SELECT * FROM equipment");
        return res.json(rows);
    } catch (error) {
        console.error("Error al obtener equipos:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

// GET /api/equipment/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM equipment WHERE id = ?", [id]);
        const equipmentList = rows as any[];
        if (equipmentList.length === 0) {
            return res.status(404).json({ message: "Equipo no encontrado" });
        }
        return res.json(equipmentList[0]);
    } catch (error) {
        console.error(`Error al obtener el equipo ${req.params.id}:`, error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

// POST /api/equipment
router.post('/', async (req: Request, res: Response) => {
    try {
        const newEquipment: Equipment = req.body;
        if (!newEquipment || !newEquipment.id || !newEquipment.name) {
            return res.status(400).json({ message: 'Faltan campos requeridos (id, name).' });
        }
        const sqlQuery = `INSERT INTO equipment (id, name, brand, model, locationBuilding, locationUnit, lastCalibrationDate, lastMaintenanceDate, encargado, maintenanceFrequencyValue, maintenanceFrequencyUnit, customMaintenanceInstructions, criticality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const formatDate = (date: string | undefined | null): string | null => {
            if (!date) return null;
            return new Date(date).toISOString().split('T')[0];
        };
        const values = [
            newEquipment.id, newEquipment.name, newEquipment.brand || null, newEquipment.model || null,
            newEquipment.locationBuilding || null, newEquipment.locationUnit || null,
            formatDate(newEquipment.lastCalibrationDate),
            formatDate(newEquipment.lastMaintenanceDate),
            newEquipment.encargado || null, newEquipment.maintenanceFrequency?.value || null,
            newEquipment.maintenanceFrequency?.unit || null,
            newEquipment.customMaintenanceInstructions || null, newEquipment.criticality || null
        ];
        await pool.query(sqlQuery, values);
        // 🛎️ Lógica para generar notificación si aplica
    if (
      newEquipment.lastMaintenanceDate &&
      newEquipment.maintenanceFrequency?.value &&
      newEquipment.maintenanceFrequency?.unit
    ) {
      const maintenanceDate = new Date(newEquipment.lastMaintenanceDate);
      let frecuenciaDias = 0;

      switch (newEquipment.maintenanceFrequency.unit) {
        case 'Días':
          frecuenciaDias = newEquipment.maintenanceFrequency.value;
          break;
        case 'Semanas':
          frecuenciaDias = newEquipment.maintenanceFrequency.value * 7;
          break;
        case 'Meses':
          frecuenciaDias = newEquipment.maintenanceFrequency.value * 30;
          break;
        default:
          frecuenciaDias = 0;
      }

      const hoy = new Date();
      const diasDesdeUltimoMant = differenceInDays(hoy, maintenanceDate);
      const diasRestantes = frecuenciaDias - diasDesdeUltimoMant;

      let tipo: 'maintenance_overdue' | 'maintenance_due' | null = null;
      let mensaje = `Equipo "${newEquipment.name}"`;

      if (diasRestantes <= 0) {
        tipo = 'maintenance_overdue';
        mensaje += ' tiene el mantenimiento VENCIDO.';
      } else if (diasRestantes <= 7) {
        tipo = 'maintenance_due';
        mensaje += ` requiere mantenimiento en ${diasRestantes} día(s).`;
      }

      if (tipo) {
        await pool.query(
          `INSERT INTO notifications (id, type, message, link, created_at, is_read)
           VALUES (?, ?, ?, ?, NOW(), false)`,
          [
            `notif-${Date.now()}`,
            tipo,
            mensaje,
            `/equipment/${newEquipment.id}`
          ]
        );
      }
    }

    return res.status(201).json({ message: 'Equipo creado exitosamente' });
  } catch (error) {
    console.error("Error al crear el equipo:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

// PUT /api/equipment/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedEquipment: Equipment = req.body;
        if (!updatedEquipment) {
            return res.status(400).json({ message: 'No se recibieron datos para actualizar.' });
        }
        const sql = `UPDATE equipment SET name = ?, brand = ?, model = ?, locationBuilding = ?, locationUnit = ?, lastCalibrationDate = ?, lastMaintenanceDate = ?, encargado = ?, maintenanceFrequencyValue = ?, maintenanceFrequencyUnit = ?, customMaintenanceInstructions = ?, criticality = ? WHERE id = ?`;
        const formatDate = (date: string | undefined | null): string | null => {
            if (!date) return null;
            return new Date(date).toISOString().split('T')[0];
        };
        const values = [
            updatedEquipment.name, updatedEquipment.brand || null, updatedEquipment.model || null,
            updatedEquipment.locationBuilding || null, updatedEquipment.locationUnit || null,
            formatDate(updatedEquipment.lastCalibrationDate),
            formatDate(updatedEquipment.lastMaintenanceDate),
            updatedEquipment.encargado || null,
            updatedEquipment.maintenanceFrequency?.value || null,
            updatedEquipment.maintenanceFrequency?.unit || null,
            updatedEquipment.customMaintenanceInstructions || null,
            updatedEquipment.criticality || null,
            id
        ];
        const [result] = await pool.query(sql, values);
        const apacket = result as any;
        if (apacket.affectedRows === 0) {
            return res.status(404).json({ message: "Equipo no encontrado para actualizar." });
        }
        return res.status(200).json({ message: 'Equipo actualizado exitosamente' });
    } catch (error) {
        console.error("Error al actualizar el equipo:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

// DELETE /api/equipment/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM equipment WHERE id = ?", [id]);
        const apacket = result as any;
        if (apacket.affectedRows === 0) {
            return res.status(404).json({ message: "Equipo no encontrado para eliminar." });
        }
        return res.status(200).json({ message: 'Equipo eliminado exitosamente' });
    } catch (error) {
        console.error("Error al eliminar el equipo:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});


// --- RUTAS NUEVAS PARA HISTORIAL DE MANTENIMIENTO ---

// POST /api/equipment/:id/maintenance
router.post('/:id/maintenance', upload.single('attachment'), async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    try {
        const { id: equipmentId } = req.params;
        const { description, performedBy, date } = req.body;
        const attachment = req.file;

        if (!description || !performedBy || !date) {
            return res.status(400).json({ message: 'Faltan campos requeridos.' });
        }

        const recordId = `maint-${Date.now()}`;
        const attachmentPath = attachment ? attachment.path : null;

        const sql = `
            INSERT INTO maintenance_records (id, equipmentId, date, description, performedBy, attachmentPath)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [recordId, equipmentId, date, description, performedBy, attachmentPath];

        await pool.query(sql, values);
        res.status(201).json({ message: 'Registro de mantenimiento añadido exitosamente.' });
    } catch (error) {
        console.error("Error al añadir el registro de mantenimiento:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

// GET /api/equipment/:id/maintenance
router.get('/:id/maintenance', async (req: Request, res: Response) => {
    try {
        const { id: equipmentId } = req.params;
        const [rows] = await pool.query(
            "SELECT * FROM maintenance_records WHERE equipmentId = ? ORDER BY date DESC",
            [equipmentId]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener el historial de mantenimiento:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});


export default router;