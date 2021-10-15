import { bootstrap, JobQueueService } from "@vendure/core";
import { configProd } from "./vendure-config-prod";

// bootstrap(configProd).catch((err) => {
//   console.log(err);
// });

bootstrap(configProd)
  .then((app) => app.get(JobQueueService).start())
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
