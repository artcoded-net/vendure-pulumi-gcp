import { bootstrap } from "@vendure/core";
import { configDev } from "./vendure-config-dev";

bootstrap(configDev).catch((err) => {
  console.log(err);
});
