import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as random from "@pulumi/random";
import { BucketsNetworking } from "../Buckets/BucketsNetworking";
import { Input, Output } from "@pulumi/pulumi";
import { DatabaseEnvData } from "../lib/types";
import { getRevisionTrafficAllocation } from "../lib/utils";

interface CloudRunInputs {
  databaseInfo: DatabaseEnvData;
  vendureImageName: Output<string> | string;
  assetBucketName: Input<string>;
  serviceAccountEmail: Output<string>;
  assetsCdnHostname?: Input<string>;
  domainSuffix?: string;
  maintainTrafficToRevision?: string;
  customResourcePrefix?: string;
}

// const location = gcp.config.region || "eu-central1";
const location = "europe-west1";
const projectName = gcp.config.project;
const stack = pulumi.getStack();
const namingPrefix = `${projectName}-${stack}`;
const config = new pulumi.Config();
const siteName = config.require<string>("siteName");
const shopEmail = config.require<string>("shopEmail");
const siteUrl = config.require<string>("siteUrl");
const siteDomain = config.require<string>("siteDomain");
const mailgunUser = config.require<string>("mailgunUser");
const mailgunPassword = config.requireSecret<string>("mailgunPassword");
const SERVER_INTERNAL_PORT = 3000;
// const WORKER_INTERNAL_PORT = 3020;
const DB_NAME = "postgres";

export class CloudRun {
  vendureServer: gcp.cloudrun.Service;

  constructor({
    vendureImageName,
    databaseInfo,
    assetBucketName,
    serviceAccountEmail,
    assetsCdnHostname,
    maintainTrafficToRevision,
    domainSuffix,
    customResourcePrefix,
  }: CloudRunInputs) {
    const resourcePrefix = customResourcePrefix ?? namingPrefix;
    const vendureServerHostname = domainSuffix
      ? `server-${domainSuffix}.${siteDomain}`
      : `server.${siteDomain}`;

    const googleTasksSecret = new random.RandomId(
      `${resourcePrefix}-tasks-secret`,
      {
        byteLength: 10,
      }
    ).b64Std;

    const { dbUsername, dbPassword, dbConnectionName } = databaseInfo;
    const envVariables: pulumi.Input<
      pulumi.Input<gcp.types.input.cloudrun.ServiceTemplateSpecContainerEnv>[]
    > = [
      { name: "ENV", value: stack },
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
      /**
       * For Google Cloud Tasks
       * */
      {
        name: "VENDURE_ENDPOINT",
        value: `https://${vendureServerHostname}`,
      },
      { name: "GCP_PROJECT_ID", value: projectName },
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

    if (assetsCdnHostname)
      envVariables.push({
        name: "ASSETS_CDN_DOMAIN",
        value: assetsCdnHostname,
      });

    const serverServiceName = `${resourcePrefix}-server`;

    /**
     * If providing an old stable revision, point 0 traffic to the new one (just for testing);
     * otherwise simply point all traffic to the new revision
     */

    const trafficAllocation = getRevisionTrafficAllocation({
      maintainTrafficToRevision,
    });

    this.vendureServer = new gcp.cloudrun.Service(
      `${resourcePrefix}-vendure-server`,
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
                    memory: "2Gi",
                  },
                  requests: {
                    cpu: "2",
                    memory: "2Gi",
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
      `${resourcePrefix}-vendure-domain-mapping`,
      {
        name: vendureServerHostname,
        location,
        metadata: {
          namespace: projectName || pulumi.getProject(),
        },
        spec: {
          routeName: this.vendureServer.name,
        },
      }
    );
  }
}
