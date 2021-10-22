export type Environment = "dev" | "test" | "prod";

export interface PostgresDbData {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}
