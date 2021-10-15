import { bootstrapWorker, VendureConfig, mergeConfig } from "@vendure/core";
import { configProd } from "./vendure-config-prod";

bootstrapWorker(configProd)
  .then((worker) => worker.startJobQueue())
  .catch((err) => {
    console.log(err);
  });
