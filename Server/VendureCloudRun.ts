import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as random from "@pulumi/random";
import { BucketsNetworking } from "../Buckets/BucketsNetworking";
import { Input, Output } from "@pulumi/pulumi";
import { DatabaseEnvData } from "../lib/types";
import { getRevisionTrafficAllocation } from "../lib/utils";

interface VendureCloudRunInputs {
  databaseInfo: DatabaseEnvData;
  vendureImageName: Output<string>;
  assetBucketName: Input<string>;
  serviceAccountEmail: Output<string>;
  bucketsNetworking?: BucketsNetworking;
  maintainTrafficToRevision?: string;
}

// const location = gcp.config.region || "eu-central1";
const location = "europe-west1";
const projectName = pulumi.getProject();
const env = pulumi.getStack();
const config = new pulumi.Config();
const siteName = config.require<string>("siteName");
const shopEmail = config.require<string>("shopEmail");
const siteUrl = config.require<string>("siteUrl");
const siteDomain = config.require<string>("siteDomain");
const mailgunUser = config.require<string>("mailgunUser");
const mailgunPassword = config.requireSecret<string>("mailgunPassword");
const gcpProjectName = gcp.config.project;
const SERVER_INTERNAL_PORT = 3000;
// const WORKER_INTERNAL_PORT = 3020;
const DB_NAME = "postgres";
const vendureServerDomain = `server${
  env == "prod" ? "" : `-${env}`
}.${siteDomain}`;
export class VendureCloudRun {
  vendureServer: gcp.cloudrun.Service;

  constructor({
    vendureImageName,
    databaseInfo,
    assetBucketName,
    serviceAccountEmail,
    bucketsNetworking,
    maintainTrafficToRevision,
  }: VendureCloudRunInputs) {
    const googleTasksSecret = new random.RandomId(
      `${projectName}-${env}-tasks-secret`,
      {
        byteLength: 10,
      }
    ).b64Std;

    const { dbUsername, dbPassword, dbConnectionName } = databaseInfo;
    const envVariables: pulumi.Input<
      pulumi.Input<gcp.types.input.cloudrun.ServiceTemplateSpecContainerEnv>[]
    > = [
      { name: "ENV", value: env },
      { name: "DATABASE_NAME", value: DB_NAME },
      {
        name: "DATABASE_HOST",
        value: dbConnectionName.apply((conn) => `/cloudsql/${conn}`),
      },
      { name: "DATABASE_USERNAME", value: dbUsername || "" },
      { name: "DATABASE_PASSWORD", value: dbPassword.apply((p) => p ?? "") },
      /**
       * For Google Cloud Storage Assets config
       * */
      {
        name: "GCP_ASSET_BUCKET",
        value: assetBucketName,
      },
      {
        name: "ASSETS_CDN_DOMAIN",
        value: bucketsNetworking?.assetsHostName,
      },
      /**
       * For Google Cloud Tasks
       * */
      {
        name: "VENDURE_ENDPOINT",
        value: `https://${vendureServerDomain}`,
      },
      { name: "GCP_PROJECT_ID", value: gcpProjectName },
      { name: "GCP_REGION", value: location },
      { name: "GOOGLE_TASKS_SECRET", value: googleTasksSecret },
      /**
       * End vars for Google Cloud Tasks
       * */
      {
        name: "SHOP_NAME",
        value: siteName,
      },
      {
        name: "SHOP_EMAIL",
        value: shopEmail,
      },
      {
        name: "SITE_URL",
        value: siteUrl,
      },
      {
        name: "MAILGUN_USER",
        value: mailgunUser,
      },
      {
        name: "MAILGUN_PASSWORD",
        value: mailgunPassword,
      },
    ];

    const serverServiceName = `${projectName}-${env}-server`;
    // const revisionSuffix = getRandomId({
    //   name: `${projectName}-${env}-vendure-revision-suffix`,
    //   forceRegeneration: true,
    //   length: 8,
    // });
    // const newRevisionName = revisionSuffix.apply(
    //   (suffix) => `${serverServiceName}-${suffix.toLowerCase()}`
    // );

    /**
     * If providing an old stable revision, point 0 traffic to the new one (just for testing);
     * otherwise simply point all traffic to the new revision
     */

    const trafficAllocation = getRevisionTrafficAllocation({
      maintainTrafficToRevision,
    });

    this.vendureServer = new gcp.cloudrun.Service(
      `${projectName}-vendure-server`,
      {
        name: serverServiceName,
        location,
        template: {
          metadata: {
            annotations: {
              "run.googleapis.com/cloudsql-instances": dbConnectionName,
            },
            // name: newRevisionName,
          },
          spec: {
            serviceAccountName: serviceAccountEmail,
            containers: [
              {
                commands: ["/bin/sh"],
                args: ["-c", "yarn run:server"],
                // args: ["-c", "yarn start"],
                image: vendureImageName,
                ports: [{ containerPort: SERVER_INTERNAL_PORT }],
                resources: {
                  limits: {
                    cpu: "2",
                    memory: "2",
                  },
                  requests: {
                    cpu: "2",
                    memory: "2",
                  },
                },
                envs: envVariables,
              },
            ],
            timeoutSeconds: 1000,
          },
        },
        metadata: {
          annotations: {
            "autoscaling.knative.dev/minScale": "1",
            "autoscaling.knative.dev/maxScale": "2",
            "autoscaling.knative.dev/scaleDownDelay": "15m",
            "run.googleapis.com/cloudsql-instances": dbConnectionName,
            "run.googleapis.com/client-name": "vendure-server",
          },
        },
        traffics: trafficAllocation,
        autogenerateRevisionName: true,
      }
    );

    // Grant access to the server container via HTTPS to all members
    const publicAccessRole = this.vendureServer.name.apply(
      (name) =>
        new gcp.cloudrun.IamMember(`${name}-iam-public-access`, {
          service: name,
          location,
          role: "roles/run.invoker",
          member: "allUsers",
        })
    );

    const domainMapping = new gcp.cloudrun.DomainMapping(
      `${projectName}-vendure-domain-mapping`,
      {
        name: vendureServerDomain,
        location,
        metadata: {
          namespace: gcpProjectName || projectName,
        },
        spec: {
          routeName: this.vendureServer.name,
        },
      }
    );
  }
}
