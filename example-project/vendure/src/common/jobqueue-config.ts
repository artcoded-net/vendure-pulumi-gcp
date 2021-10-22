import { PubSubOptions, jobsQueues } from "@artcoded/job-queue-plugin";
import { CloudTaskOptions } from "vendure-plugin-google-cloud-tasks";

// export const getJobqueueConfig: () => PubSubOptions = () => {
//   const queueNamePubSubPair = new Map<string, [string, string]>();
//   for (let jobsQueue of jobsQueues) {
//     const envPrefix = jobsQueue.toUpperCase().split("-").join("_");
//     queueNamePubSubPair.set(jobsQueue, [
//       process.env[`${envPrefix}_TOPIC`] || jobsQueue,
//       process.env[`${envPrefix}_SUBSCRIPTION`] || jobsQueue,
//     ]);
//   }
//   return { queueNamePubSubPair };
// };

export const getCloudTasksConfig: () => CloudTaskOptions = () => {
  const { VENDURE_ENDPOINT, GCP_PROJECT_ID, GCP_REGION, GOOGLE_TASKS_SECRET } =
    process.env;

  return {
    // Must be public
    taskHandlerHost: VENDURE_ENDPOINT || "",
    projectId: GCP_PROJECT_ID || "",
    // Where the taskqueue will be created
    location: GCP_REGION || "",
    // Used to prevent unwanted requests to your public endpoint
    authSecret: GOOGLE_TASKS_SECRET || "",
    // Used to distinguish taskQueues within the same
    // Google Project (if you have OTAP environments in the same project for example)
    // queueSuffix: "plugin-test",
  };
};
