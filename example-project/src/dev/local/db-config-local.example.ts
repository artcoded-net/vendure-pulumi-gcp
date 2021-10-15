import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export const localRemoteDbConfig: PostgresConnectionOptions = {
  type: "postgres",
  host: "1.1.1.1",
  synchronize: false,
  database: "postgres",
  username: "postgres",
  password: "aStrongPassword",
};
