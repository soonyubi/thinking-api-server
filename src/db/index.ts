import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

export async function createConnection() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
  });
  return drizzle(connection);
}
