import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const projectName = gcp.config.project;
const stack = pulumi.getStack();
const namingPrefix = `${projectName}-${stack}`;
const DEFAULT_BUCKET_NAME = `${namingPrefix}-asset-bucket`;

export class AdminBucket {
  bucket: gcp.storage.Bucket;
  bucketName: string;
  // backend: gcp.compute.BackendBucket;

  constructor(customBucketName?: string) {
    this.bucketName = customBucketName ?? DEFAULT_BUCKET_NAME;
    this.bucket = new gcp.storage.Bucket(this.bucketName, {
      name: this.bucketName,
      website: {
        mainPageSuffix: "index.html",
        notFoundPage: "index.html",
      },
      uniformBucketLevelAccess: true,
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
    //   description: "Admin bucket",
    //   bucketName: this.bucket.name,
    //   enableCdn: false,
    // });
  }
}
