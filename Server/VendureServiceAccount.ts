import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const projectName = pulumi.getProject();
const accountName = `${projectName}-run-sa`;

export class VendureServiceAccount {
  key: gcp.serviceaccount.Key;
  account: gcp.serviceaccount.Account;

  constructor() {
    this.account = new gcp.serviceaccount.Account(accountName, {
      accountId: accountName,
      displayName: "Cloud Run Service Account",
    });
    this.key = new gcp.serviceaccount.Key(`${projectName}-service-account`, {
      serviceAccountId: this.account.name,
      publicKeyType: "TYPE_X509_PEM_FILE",
    });

    const serviceAccountMember = this.account.email.apply(
      (email) => `serviceAccount:${email}`
    );

    const cloudrunStorageAdmin = new gcp.projects.IAMMember(
      `${projectName}-cloudrun-storage-iam`,
      {
        member: serviceAccountMember,
        role: "roles/storage.admin",
      }
    );
    const cloudrunSqlClient = new gcp.projects.IAMMember(
      `${projectName}-cloudrun-sql-iam`,
      {
        member: serviceAccountMember,
        role: "roles/cloudsql.client",
      }
    );
    // Allow to invoke other cloudrun services
    const cloudrunInvoker = new gcp.projects.IAMMember(
      `${projectName}-cloudrun-run-invoker-iam`,
      {
        member: serviceAccountMember,
        role: "roles/run.invoker",
      }
    );
    const cloudTasksAdmin = new gcp.projects.IAMMember(
      `${projectName}-cloudrun-cloudtasks-iam`,
      {
        member: serviceAccountMember,
        role: "roles/cloudtasks.admin",
      }
    );
  }
}
