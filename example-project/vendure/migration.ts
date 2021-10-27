import {
  generateMigration,
  revertLastMigration,
  runMigrations,
} from "@vendure/core";
import program from "commander";
import { configDev } from "./src/dev/vendure-config-dev";

program
  .command("generate <name>")
  .description("Generate a new migration file with the given name")
  .action((name) => {
    return generateMigration(configDev, {
      name,
      outputDir: "./migrations",
    });
  });

program
  .command("run")
  .description("Run all pending migrations")
  .action(() => {
    return runMigrations(configDev);
  });

program
  .command("revert")
  .description("Revert the last applied migration")
  .action(() => {
    return revertLastMigration(configDev);
  });

program.parse(process.argv);
