import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const location = "europe-west1";

export class JobQueues {
  queues: gcp.cloudtasks.Queue[];
  constructor(jobQueues: string[]) {
    this.queues = [];
    for (let queue of jobQueues) {
      this.queues.push(this.createQueue(queue));
    }
  }
  createQueue = (queueName: string) =>
    new gcp.cloudtasks.Queue(`queue-${queueName}`, {
      name: queueName,
      location,
    });
}
