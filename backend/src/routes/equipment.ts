// backend/src/routes/equipment.ts

import { Router, Request, Response } from 'express';
import pool from '../db';
import { Equipment } from '../types';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Importamos el módulo 'fs' para manejar el sistema de archivos

// --- INICIO DE LA CONFIGURACIÓN CORREGIDA ---

const uploadDir = 'uploads/';
// Esta línea es clave: se asegura de que la carpeta 'uploads' exista antes de que multer intente usarla.
fs.mkdirSync(uploadDir, { recursive: true });

// Configuración de Multer para definir dónde y cómo guardar los archivos.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Directorio donde se guardarán los archivos
    },
    filename: (req, file, cb) => {
        // Creamos un nombre de archivo único para evitar que se sobreescriban.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
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

// POST /api/equipment - Modificada para aceptar un archivo
router.post('/', upload.single('initialDoc'), async (req: Request, res: Response) => {
    try {
        const newEquipmentData = req.body;
        const attachment = req.file;

        if (!newEquipmentData || !newEquipmentData.id || !newEquipmentData.name) {
            return res.status(400).json({ message: 'Faltan campos requeridos (id, name).' });
        }

        const sqlQuery = `INSERT INTO equipment (id, name, brand, model, locationBuilding, locationUnit, lastCalibrationDate, lastMaintenanceDate, encargado, maintenanceFrequencyValue, maintenanceFrequencyUnit, customMaintenanceInstructions, criticality, initialDocPath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const formatDate = (date: string | undefined | null): string | null => {
            if (!date) return null;
            return new Date(date).toISOString().split('T')[0];
        };

        const values = [
            newEquipmentData.id, newEquipmentData.name, newEquipmentData.brand || null,
            newEquipmentData.model || null, newEquipmentData.locationBuilding || null,
            newEquipmentData.locationUnit || null, formatDate(newEquipmentData.lastCalibrationDate),
            formatDate(newEquipmentData.lastMaintenanceDate), newEquipmentData.encargado || null,
            newEquipmentData.maintenanceFrequency_value, // Ojo con los nombres que envía FormData
            newEquipmentData.maintenanceFrequency_unit,
            newEquipmentData.customMaintenanceInstructions || null,
            newEquipmentData.criticality || null,
            attachment ? attachment.path : null // Guardamos la ruta del archivo
        ];

        await pool.query(sqlQuery, values);
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
router.post('/:id/maintenance', upload.single('attachment'), async (req: Request, res: Response) => {
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