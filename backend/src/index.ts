// backend/src/index.ts

import express from 'express';
import cors from 'cors';
import path from 'path'; // <-- 1. IMPORTA la librería 'path'
import equipmentRoutes from './routes/equipment';
import issueRoutes from './routes/issues';
import userRoutes from './routes/users';
import notificacionesRoutes from './routes/notificaciones';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// --- 2. AÑADE ESTA LÍNEA CLAVE ---
// Esto crea una ruta estática. Cualquier petición a /uploads/...
// servirá los archivos que están en la carpeta backend/uploads.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// Rutas de la API
app.use('/api/equipment', equipmentRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificacionesRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});