import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  multipleStatements: true,
});

pool
  .getConnection()
  .then(() => console.log("Connected to MySQL successfully"))
  .catch((err) => console.error("Error connecting to MySQL:", err));
