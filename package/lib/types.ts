import { Output } from "@pulumi/pulumi";

export interface DatabaseEnvData {
  dbUsername: Output<string>;
  dbPassword: Output<string>;
  dbConnectionName: Output<string>;
}
