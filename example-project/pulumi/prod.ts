import vendurePackage from "../package.json";
import { ApiServices } from "@artcoded/vendure-pulumi/Base/ApiServices";
import { BuildDockerTrigger } from "@artcoded/vendure-pulumi/Server/BuildDockerTrigger";
import { CloudRunServiceAccount } from "@artcoded/vendure-pulumi/Server/CloudRunServiceAccount";
import { CloudRun } from "@artcoded/vendure-pulumi/Server/CloudRun";
import { Database } from "@artcoded/vendure-pulumi/Database/Database";
import { AdminBucket } from "@artcoded/vendure-pulumi/Buckets/AdminBucket";
import { AssetBucket } from "@artcoded/vendure-pulumi/Buckets/AssetBucket";
import { BucketsNetworking } from "@artcoded/vendure-pulumi/Buckets/BucketsNetworking";

export default () => {
  /**
   * Base services
   */

  const enablingServices = [new ApiServices()];
  const vendureDockerBuildTrigger = new BuildDockerTrigger({
    packageInfo: vendurePackage,
    repository: "vendure-pulumi-gcp",
    tagRegex: `^v([0-9.]+)$`,
  });
  const vendureServiceAccount = new CloudRunServiceAccount();

  // Database
  const database = new Database({});
  const databaseInfo = database.getDatabaseEnv();

  // Asset bucket
  const assetBucket = new AssetBucket();
  const assetBucketName = assetBucket.bucket.name;
  const assetBucketBackendId = assetBucket.backend.id;

  // Admin site bucket
  const adminBucket = new AdminBucket();
  const adminBucketBackendId = adminBucket.backend.id;
  const networkConfig = new BucketsNetworking({
    adminBackendId: adminBucketBackendId,
    assetsBackendId: assetBucketBackendId,
  });
  const vendureImageName = vendureDockerBuildTrigger.encodedImageName.replace(
    "$_VER",
    `v${vendurePackage.version}`
  );

  const serviceAccountEmail = vendureServiceAccount.account.email;

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
      vendureImageName,
      endpoint: vendureApiEndpoint,
      latestReadyRevision:
        vendureApp.vendureServer.statuses[0].latestReadyRevisionName,
      serviceAccountEmail,
    },
    mainIpAddress: networkConfig.ipAddress.address,
  };
};
