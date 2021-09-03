import * as gcp from "@pulumi/gcp";

const bucketName = `${gcp.config.project}-asset-bucket`;

export class AssetBucket {
  bucket: gcp.storage.Bucket;
  backend: gcp.compute.BackendBucket;

  constructor() {
    this.bucket = new gcp.storage.Bucket(bucketName, {
      name: bucketName,
      uniformBucketLevelAccess: true,
      cors: [
        {
          origins: ["*"],
          methods: ["*"],
          responseHeaders: [
            "access-control-expose-headers",
            "access-control-allow-origin",
            "access-control-allow-credentials",
          ],
        },
      ],
    });

    const bucketIAMBinding = new gcp.storage.BucketIAMBinding(
      `${bucketName}-IAMBinding`,
      {
        bucket: this.bucket.name,
        role: "roles/storage.objectViewer",
        members: ["allUsers"],
      }
    );

    this.backend = new gcp.compute.BackendBucket(`${bucketName}-backend`, {
      description: "Assets bucket",
      bucketName: this.bucket.name,
      enableCdn: true, // TODO: check costs effectiveness
    });
  }
}
