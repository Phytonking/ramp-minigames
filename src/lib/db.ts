import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

type DB = NeonHttpDatabase<typeof schema>;

let _db: DB | null = null;

/**
 * Lazily construct the Drizzle client on first use. Deferring the `neon()`
 * call keeps module import side-effect free so `next build` can collect page
 * data without a `DATABASE_URL` (env is only required when a query actually
 * runs at request time).
 */
function getDb(): DB {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set — required to query the database."
      );
    }
    _db = drizzle(neon(url), { schema });
  }
  return _db;
}

export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
