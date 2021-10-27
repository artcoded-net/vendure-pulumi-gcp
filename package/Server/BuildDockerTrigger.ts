import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const projectName = gcp.config.project;
const stack = pulumi.getStack();
const namingPrefix = `${projectName}-${stack}`;
const codebuildDockerImage = "gcr.io/cloud-builders/docker";

interface BuildDockerTriggerInputs {
  packageInfo: any;
  githubRepository: string;
  githubUser: string;
  tagRegex?: string;
}

export class BuildDockerTrigger {
  trigger: gcp.cloudbuild.Trigger;
  encodedImageName: string;

  constructor({
    packageInfo,
    githubRepository,
    githubUser,
    tagRegex,
  }: BuildDockerTriggerInputs) {
    const packageName = packageInfo.name;
    this.encodedImageName = `eu.gcr.io/${projectName}/vendure:$_VER`;

    const triggerName = `${namingPrefix}-backend-docker-trigger`;
    this.trigger = new gcp.cloudbuild.Trigger(triggerName, {
      name: triggerName,
      github: {
        owner: githubUser,
        name: githubRepository, // this is NOT the name of the repo
        push: {
          // prettier-ignore
          tag: tagRegex?? `^${packageName}@([0-9.]+)$`,
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
        // logsBucket: `gs://${projectName}/logs`,
        queueTtl: "20s",
        timeout: `${30 * 60}s`, // 30 minuti
      },
    });
  }
}
