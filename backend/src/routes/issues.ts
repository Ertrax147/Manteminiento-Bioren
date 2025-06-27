// backend/src/routes/issues.ts

import { Router, Request, Response } from 'express';
import pool from '../db';
import { IssueReport } from '../types';
import multer from 'multer'; // 1. Importamos multer
import path from 'path';   // e importamos path
import fs from 'fs';       // e importamos fs

// 2. Reutilizamos la misma configuración de Multer
const uploadDir = 'uploads/';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
const router = Router();

// GET /api/issues - (Sin cambios)
router.get('/', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query("SELECT * FROM issue_reports ORDER BY dateTime DESC");
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener incidencias:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// --- RUTA POST MODIFICADA ---
// 3. Añadimos el middleware de multer 'upload.single('attachment')'
router.post('/', upload.single('attachment'), async (req: Request, res: Response) => {
    try {
        const newIssue: Omit<IssueReport, 'id' | 'dateTime'> = req.body;
        const attachment = req.file; // multer nos entrega el archivo aquí

        if (!newIssue || !newIssue.equipmentId || !newIssue.description || !newIssue.severity) {
            return res.status(400).json({ message: 'Faltan campos requeridos.' });
        }

        const issueId = `issue-${Date.now()}`;
        const reportDate = new Date();
        const attachmentPath = attachment ? attachment.path : null; // Guardamos la ruta del archivo

        const sql = `
            INSERT INTO issue_reports 
            (id, equipmentId, reportedBy, dateTime, description, severity, status, attachmentPath) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            issueId, newIssue.equipmentId, newIssue.reportedBy,
            reportDate, newIssue.description, newIssue.severity,
            'Abierto', attachmentPath
        ];

        await pool.query(sql, values);
        res.status(201).json({ message: 'Incidencia reportada exitosamente' });

    } catch (error) {
        console.error("Error al reportar la incidencia:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// Las rutas PUT y DELETE se quedan igual por ahora

export default router;