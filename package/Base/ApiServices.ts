import * as gcp from "@pulumi/gcp";

const projectName = gcp.config.project;

export class ApiServices {
  services: gcp.projects.Service[];

  constructor() {
    this.services = [
      new gcp.projects.Service(`${projectName}-enable-cloud-run`, {
        service: "run.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${projectName}-enable-container-registry`, {
        service: "containerregistry.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${projectName}-enable-cloudbuild`, {
        service: "cloudbuild.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${projectName}-enable-cloudsql`, {
        service: "sqladmin.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${projectName}-enable-compute`, {
        service: "compute.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${projectName}-enable-cloudstorage`, {
        service: "storage.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${projectName}-enable-cloudtasks`, {
        service: "cloudtasks.googleapis.com",
        disableDependentServices: true,
      }),
    ];
  }
}
