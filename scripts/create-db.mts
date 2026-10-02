import "dotenv/config";
import pg from "pg";

const url = new URL(process.env.DATABASE_URL!);
const client = new pg.Client({
  host: url.hostname,
  port: Number(url.port),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
});

await client.connect();
const name = "igsorteos";
const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
  name,
]);

if (exists.rowCount === 0) {
  await client.query(`CREATE DATABASE ${name}`);
  console.log("Base creada:", name);
} else {
  console.log("La base ya existe:", name);
}
await client.end();
