import * as gcp from "@pulumi/gcp";

const cloudProjectId = gcp.config.project;
const codebuildDockerImage = "gcr.io/cloud-builders/docker";

interface BuildDockerTriggerInputs {
  packageInfo: any;
}

export class BuildDockerTrigger {
  trigger: gcp.cloudbuild.Trigger;
  encodedImageName: string;

  constructor({ packageInfo }: BuildDockerTriggerInputs) {
    const packageName = packageInfo.name;
    this.encodedImageName = `eu.gcr.io/${cloudProjectId}/vendure:v$_VER`;

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
            args: ["build", "-t", this.encodedImageName, `.`],
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
