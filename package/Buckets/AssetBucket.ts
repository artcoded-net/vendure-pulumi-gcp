import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const projectName = gcp.config.project;
const stack = pulumi.getStack();
const namingPrefix = `${projectName}-${stack}`;
const DEFAULT_BUCKET_NAME = `${namingPrefix}-asset-bucket`;

export class AssetBucket {
  bucket: gcp.storage.Bucket;
  bucketName: string;
  // backend: gcp.compute.BackendBucket;

  constructor(customBucketName?: string) {
    this.bucketName = customBucketName ?? DEFAULT_BUCKET_NAME;
    this.bucket = new gcp.storage.Bucket(this.bucketName, {
      name: this.bucketName,
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
      `${this.bucketName}-IAMBinding`,
      {
        bucket: this.bucket.name,
        role: "roles/storage.objectViewer",
        members: ["allUsers"],
      }
    );

    // this.backend = new gcp.compute.BackendBucket(`${this.bucketName}-backend`, {
    //   description: "Assets bucket",
    //   bucketName: this.bucket.name,
    //   enableCdn: true, // TODO: check costs effectiveness
    // });
  }
}
