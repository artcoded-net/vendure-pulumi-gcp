import * as gcp from "@pulumi/gcp";
const projectName = gcp.config.project;

interface ApiServicesInputs {
  customResourcePrefix?: string;
}

export class ApiServices {
  services: gcp.projects.Service[];

  constructor({ customResourcePrefix }: ApiServicesInputs) {
    const resoursePrefix = customResourcePrefix ?? projectName;
    this.services = [
      new gcp.projects.Service(`${resoursePrefix}-enable-cloud-run`, {
        service: "run.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${resoursePrefix}-enable-container-registry`, {
        service: "containerregistry.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${resoursePrefix}-enable-cloudbuild`, {
        service: "cloudbuild.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${resoursePrefix}-enable-cloudsql`, {
        service: "sqladmin.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${resoursePrefix}-enable-compute`, {
        service: "compute.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${resoursePrefix}-enable-cloudstorage`, {
        service: "storage.googleapis.com",
        disableDependentServices: true,
      }),
      new gcp.projects.Service(`${resoursePrefix}-enable-cloudtasks`, {
        service: "cloudtasks.googleapis.com",
        disableDependentServices: true,
      }),
    ];
  }
}
