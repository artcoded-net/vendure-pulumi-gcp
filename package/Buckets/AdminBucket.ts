import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const projectName = gcp.config.project;
const stack = pulumi.getStack();
const namingPrefix = `${projectName}-${stack}`;
const bucketName = `${namingPrefix}-admin-bucket`;

export class AdminBucket {
  bucket: gcp.storage.Bucket;
  // backend: gcp.compute.BackendBucket;

  constructor() {
    this.bucket = new gcp.storage.Bucket(bucketName, {
      name: bucketName,
      website: {
        mainPageSuffix: "index.html",
        notFoundPage: "index.html",
      },
      uniformBucketLevelAccess: true,
    });

    const bucketIAMBinding = new gcp.storage.BucketIAMBinding(
      `${bucketName}-IAMBinding`,
      {
        bucket: this.bucket.name,
        role: "roles/storage.objectViewer",
        members: ["allUsers"],
      }
    );

    // this.backend = new gcp.compute.BackendBucket(`${bucketName}-backend`, {
    //   description: "Admin bucket",
    //   bucketName: this.bucket.name,
    //   enableCdn: false,
    // });
  }
}
