import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const pulumiProject = pulumi.getProject();
const cloudProjectId = gcp.config.project;
const codebuildDockerImage = "gcr.io/cloud-builders/docker";

interface BackendBuildDockerTriggerInputs {
  packageInfo: any;
}

export class BackendBuildDockerTrigger {
  trigger: gcp.cloudbuild.Trigger;
  encodedImageName: string;

  constructor({ packageInfo }: BackendBuildDockerTriggerInputs) {
    const packageName = packageInfo.name;
    const packageVersion = packageInfo.version;
    const serviceIdentifier = packageName.includes("vendure")
      ? "vendure"
      : "strapi";
    const projectDir = `projects/${pulumiProject}/${serviceIdentifier}`;
    this.encodedImageName = `eu.gcr.io/${cloudProjectId}/${serviceIdentifier}:v$_VER`;

    const triggerName = `${cloudProjectId}-backend-docker-trigger`;
    this.trigger = new gcp.cloudbuild.Trigger(triggerName, {
      name: triggerName,
      github: {
        owner: "artcoded-net",
        name: "artcoded-cms", // this is NOT the name of the repo
        push: {
          // prettier-ignore
          tag: `^${packageName}@([0-9.]+)$`,
        },
      },
      build: {
        substitutions: {
          _VER: "${TAG_NAME##@*@}",
        },
        steps: [
          {
            id: "Docker build",
            name: codebuildDockerImage,
            args: [
              "build",
              "-t",
              this.encodedImageName,
              "-f",
              `${projectDir}/Dockerfile`,
              `./${projectDir}`,
            ],
          },
          {
            id: "Docker push",
            name: codebuildDockerImage,
            args: ["push", this.encodedImageName],
          },
        ],
        images: [this.encodedImageName],
        // logsBucket: `gs://${cloudProjectId}/logs`,
        queueTtl: "20s",
        timeout: `${30 * 60}s`, // 30 minuti
      },
    });
  }
}
