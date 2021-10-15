import { bootstrapWorker, VendureConfig, mergeConfig } from "@vendure/core";
import { configDev } from "./vendure-config-dev";

bootstrapWorker(configDev)
  .then((worker) => worker.startJobQueue())
  .catch((err) => {
    console.log(err);
  });
