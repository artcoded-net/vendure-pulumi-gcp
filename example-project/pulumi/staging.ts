import * as pulumi from "@pulumi/pulumi";
import vendurePackage from "../package.json";
import { Output } from "@pulumi/pulumi";
import { ApiServices } from "@artcoded/vendure-pulumi/Base/ApiServices";
import { BuildDockerTrigger } from "@artcoded/vendure-pulumi/Server/BuildDockerTrigger";
import { CloudRunServiceAccount } from "@artcoded/vendure-pulumi/Server/CloudRunServiceAccount";
import { CloudRun } from "@artcoded/vendure-pulumi/Server/CloudRun";
import { Database } from "@artcoded/vendure-pulumi/Database/Database";
import { AdminBucket } from "@artcoded/vendure-pulumi/Buckets/AdminBucket";
import { AssetBucket } from "@artcoded/vendure-pulumi/Buckets/AssetBucket";
import { BucketsNetworking } from "@artcoded/vendure-pulumi/Buckets/BucketsNetworking";

export default () => {
  const projectName = pulumi.getProject();
  const prodStack = new pulumi.StackReference(
    `artcoded-dev/${projectName}/prod`
  );

  // Database
  const database = new Database({
    sourceInstanceName: prodStack.getOutput(
      "database.instanceName"
    ) as Output<string>,
  });
  const databaseInfo = database.getDatabaseEnv();

  // Asset bucket
  const assetBucketName = prodStack.getOutput(
    "assetBucket.name"
  ) as Output<string>;
  const assetBucketBackendId = prodStack.getOutput(
    "assetBucket.backendId"
  ) as Output<string>;

  // Admin site bucket
  const adminBucketBackendId = prodStack.getOutput(
    "adminBucketBackendId"
  ) as Output<string>;
  const networkConfig = new BucketsNetworking({
    adminBackendId: adminBucketBackendId,
    assetsBackendId: assetBucketBackendId,
  });

  const vendureImageName = prodStack.getOutput(
    "vendureImageName"
  ) as Output<string>;

  const serviceAccountEmail = prodStack.getOutput(
    "vendureServer.serviceAccountEmail"
  ) as Output<string>;

  // Cloud Run
  const vendureApp = new CloudRun({
    databaseInfo,
    vendureImageName,
    assetBucketName,
    serviceAccountEmail,
    bucketsNetworking: networkConfig,
  });
  const vendureServerBaseUrl = vendureApp.vendureServer.statuses[0].url;
  const vendureApiEndpoint = vendureServerBaseUrl.apply(
    (url) => `${url}/shop-api`
  );

  return {
    database: {
      host: database.instance.publicIpAddress,
      instanceName: database.instance.name,
      environmentVariables: databaseInfo,
    },
    assetBucket: {
      name: assetBucketName,
      backendId: assetBucketBackendId,
    },
    adminBucketBackendId,
    vendureServer: {
      endpoint: vendureApiEndpoint,
      latestReadyRevision:
        vendureApp.vendureServer.statuses[0].latestReadyRevisionName,
    },
    mainIpAddress: networkConfig.ipAddress.address,
  };
};
