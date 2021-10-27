/**
 * This is required just for Cloud Tasks to work
 */
import * as gcp from "@pulumi/gcp";

const location = "europe-west";

export class AppEngine {
  app: gcp.appengine.Application;

  constructor() {
    this.app = new gcp.appengine.Application(
      `appengine-${gcp.config.project}`,
      {
        locationId: location,
      }
    );
  }
}
