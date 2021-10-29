import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { Input, Output } from "@pulumi/pulumi";
import { getRandomId } from "../lib/random";
import { DatabaseEnvData } from "../lib/types";

const projectName = gcp.config.project;
const stack = pulumi.getStack();
const namingPrefix = `${projectName}-${stack}`;
const config = new pulumi.Config();
const dbPassword = config.requireSecret<string>("dbPassword");

interface DatabaseInputs {
  customInstanceName?: string;
  sourceInstanceName?: Input<string>;
  customResourcePrefix?: string;
}
export class Database {
  instance: Output<gcp.sql.DatabaseInstance>;
  user: gcp.sql.User;

  constructor(inputs?: DatabaseInputs) {
    const { customInstanceName, sourceInstanceName, customResourcePrefix } =
      inputs || {};
    const resourcePrefix = customResourcePrefix ?? namingPrefix;
    const dbSuffix = getRandomId({
      name: `${resourcePrefix}-db-suffix`,
      length: 9,
      forceRegeneration: false,
    });
    this.instance = dbSuffix.apply((suffix) => {
      const instanceName =
        customInstanceName ?? `${resourcePrefix}-db-${suffix.toLowerCase()}`;
      return new gcp.sql.DatabaseInstance(instanceName, {
        name: instanceName,
        clone: sourceInstanceName ? { sourceInstanceName } : undefined,
        databaseVersion: "POSTGRES_13",
        // restoreBackupContext: '', TODO: pass to restore
        // region: "eu-central1",
        settings: {
          tier: "db-f1-micro",
          backupConfiguration: {
            enabled: true,
            pointInTimeRecoveryEnabled: true,
            backupRetentionSettings: {
              retainedBackups: 7,
            },
          },
          databaseFlags: [
            {
              name: "max_connections",
              value: "100",
            },
          ],
          // ipConfiguration: {
          //   authorizedNetworks: [
          //     {
          //       name: "home",
          //       value: "87.18.116.94",
          //     },
          //     {
          //       name: "xiaomi",
          //       value: "2.41.64.16",
          //     },
          //   ],
          // }
        },
        deletionProtection: false,
      });
    });
    const username = customInstanceName
      ? `${customInstanceName}-user`
      : `${resourcePrefix}-db-user`;
    this.user = new gcp.sql.User(username, {
      name: "postgres",
      instance: this.instance.name,
      password: dbPassword,
      deletionPolicy: "ABANDON",
    });
  }

  getDatabaseEnv: () => DatabaseEnvData = () => ({
    dbUsername: this.user.name,
    dbPassword: this.user.password.apply((password) => password ?? ""),
    dbConnectionName: this.instance.connectionName,
  });
}
