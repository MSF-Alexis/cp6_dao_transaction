export const mariaDBConfig = {
    database: process.env.DB_NAME ?? 'unknown',
    host: process.env.DB_HOST ?? '127.0.0.1',
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD,
    connectionLimit: 5
};
