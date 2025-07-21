import mariadb from 'mariadb';

let pool;
try {
    /* Connexion à la base de données grâce aux variables d'environnement */
    pool = mariadb.createPool({
        database: process.env.DB_NAME ?? 'unknown',
        host: process.env.DB_HOST ?? '127.0.0.1',
        user: process.env.DB_USER ?? 'root',
        password: process.env.DB_PASSWORD,
        connectionLimit: 5
    });
    console.log('Pool de connexion créé avec succès');
} catch (error) {
    console.error('Erreur lors de la création du pool:', error);
}

export { pool };