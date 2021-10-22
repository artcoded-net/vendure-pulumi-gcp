import path from "path";
import { BetterSqlite3ConnectionOptions } from "typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import fs from "fs";
import { PostgresDbData } from "./types";

const getMigrationsPath = () => {
  const devMigrationsPath = path.join(__dirname, "../../migrations");
  const distMigrationsPath = path.join(__dirname, "migrations");

  return fs.existsSync(distMigrationsPath)
    ? path.join(distMigrationsPath, "*.js")
    : path.join(devMigrationsPath, "*.ts");
};

/**
 * A local sqlite db configuration useful only for simple local testing
 */
export const sqliteDbConfig: BetterSqlite3ConnectionOptions = {
  type: "better-sqlite3",
  synchronize: true,
  logging: false,
  database: path.join(__dirname, "static/dev/vendure.sqlite"),
  migrations: [],
};

/**
 * A postgres db configuration useful for every environment
 */
export const getPostgresDbConfig: (
  dbData?: PostgresDbData
) => PostgresConnectionOptions = (dbData) => {
  const DATABASE_HOST = dbData?.host || process.env.DATABASE_HOST;
  const DATABASE_PORT = dbData?.port || process.env.DATABASE_PORT;
  const DATABASE_USERNAME = dbData?.username || process.env.DATABASE_USERNAME;
  const DATABASE_PASSWORD = dbData?.password || process.env.DATABASE_PASSWORD;
  const DATABASE_NAME = dbData?.database || process.env.DATABASE_NAME;

  return {
    type: "postgres",
    synchronize: false,
    logging: false, // we don't log by default even in dev mode (too noisy!)
    migrations: [getMigrationsPath()],
    host: DATABASE_HOST,
    port: Number(DATABASE_PORT),
    username: DATABASE_USERNAME,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    // url: DATABASE_URL,
    extra: {
      socketPath: DATABASE_HOST,
    },
  };
};
