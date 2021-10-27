import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const projectName = gcp.config.project;
const stack = pulumi.getStack();
const namingPrefix = `${projectName?.substr(0, 5)}-${stack}`;
const accountName = `${namingPrefix}-run-sa`;

export class CloudRunServiceAccount {
  key: gcp.serviceaccount.Key;
  account: gcp.serviceaccount.Account;

  constructor() {
    this.account = new gcp.serviceaccount.Account(accountName, {
      accountId: accountName,
      displayName: "Cloud Run Service Account",
    });
    this.key = new gcp.serviceaccount.Key(`${namingPrefix}-service-account`, {
      serviceAccountId: this.account.name,
      publicKeyType: "TYPE_X509_PEM_FILE",
    });

    const serviceAccountMember = this.account.email.apply(
      (email) => `serviceAccount:${email}`
    );

    const cloudrunStorageAdmin = new gcp.projects.IAMMember(
      `${namingPrefix}-cloudrun-storage-iam`,
      {
        member: serviceAccountMember,
        role: "roles/storage.admin",
      }
    );
    const cloudrunSqlClient = new gcp.projects.IAMMember(
      `${namingPrefix}-cloudrun-sql-iam`,
      {
        member: serviceAccountMember,
        role: "roles/cloudsql.client",
      }
    );
    // Allow to invoke other cloudrun services
    const cloudrunInvoker = new gcp.projects.IAMMember(
      `${namingPrefix}-cloudrun-run-invoker-iam`,
      {
        member: serviceAccountMember,
        role: "roles/run.invoker",
      }
    );
    const cloudTasksAdmin = new gcp.projects.IAMMember(
      `${namingPrefix}-cloudrun-cloudtasks-iam`,
      {
        member: serviceAccountMember,
        role: "roles/cloudtasks.admin",
      }
    );
  }
}
