import mysql from 'mysql2/promise';

// Pool de conexiones a la base de datos
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: 'agusbenja29', // <-- ¡IMPORTANTE! Reemplaza esto con tu contraseña de MySQL
    database: 'bioren_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Mensaje para verificar la conexión al iniciar
pool.getConnection()
    .then(connection => {
        console.log('✅ Conectado exitosamente a la base de datos MySQL!');
        connection.release(); // Devuelve la conexión al pool
    })
    .catch(err => {
        console.error('❌ Error al conectar con la base de datos:', err);
    });

export default pool;