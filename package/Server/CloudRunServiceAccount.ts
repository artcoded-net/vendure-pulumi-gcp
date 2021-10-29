import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const projectName = gcp.config.project;
const stack = pulumi.getStack();
const namingPrefix = `${projectName?.substr(0, 5)}-${stack}`;

interface CloudRunServiceAccountInputs {
  customResourcePrefix?: string;
}
export class CloudRunServiceAccount {
  key: gcp.serviceaccount.Key;
  account: gcp.serviceaccount.Account;

  constructor({ customResourcePrefix }: CloudRunServiceAccountInputs) {
    const resourcePrefix = customResourcePrefix ?? namingPrefix;
    const accountName = `${resourcePrefix}-run-sa`;
    this.account = new gcp.serviceaccount.Account(accountName, {
      accountId: accountName,
      displayName: "Cloud Run Service Account",
    });
    this.key = new gcp.serviceaccount.Key(`${resourcePrefix}-service-account`, {
      serviceAccountId: this.account.name,
      publicKeyType: "TYPE_X509_PEM_FILE",
    });

    const serviceAccountMember = this.account.email.apply(
      (email) => `serviceAccount:${email}`
    );

    const cloudrunStorageAdmin = new gcp.projects.IAMMember(
      `${resourcePrefix}-cloudrun-storage-iam`,
      {
        member: serviceAccountMember,
        role: "roles/storage.admin",
      }
    );
    const cloudrunSqlClient = new gcp.projects.IAMMember(
      `${resourcePrefix}-cloudrun-sql-iam`,
      {
        member: serviceAccountMember,
        role: "roles/cloudsql.client",
      }
    );
    // Allow to invoke other cloudrun services
    const cloudrunInvoker = new gcp.projects.IAMMember(
      `${resourcePrefix}-cloudrun-run-invoker-iam`,
      {
        member: serviceAccountMember,
        role: "roles/run.invoker",
      }
    );
    const cloudTasksAdmin = new gcp.projects.IAMMember(
      `${resourcePrefix}-cloudrun-cloudtasks-iam`,
      {
        member: serviceAccountMember,
        role: "roles/cloudtasks.admin",
      }
    );
  }
}
