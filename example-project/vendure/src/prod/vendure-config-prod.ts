import {
  VendureConfig,
  DefaultLogger,
  LogLevel,
  UuidIdStrategy,
  LanguageCode,
  DefaultSearchPlugin,
} from "@vendure/core";
import { EmailPlugin } from "@vendure/email-plugin";
import { getPostgresDbConfig } from "../common/db-config";
import { getAssetConfig } from "../common/assets-config";
import { customPlugins } from "../common/pluginsConfig";
import { getEmailConfig } from "../common/email-config";
import { AssetServerPlugin } from "@vendure/asset-server-plugin";
import { GoogleStoragePlugin } from "@artcoded/gcp-asset-server-plugin";
// import { PubSubPlugin } from "@artcoded/job-queue-plugin";
import {
  getCloudTasksConfig,
  // getJobqueueConfig,
} from "../common/jobqueue-config";
import { CloudTasksPlugin } from "vendure-plugin-google-cloud-tasks";

const { SUPERADMIN_USER, SUPERADMIN_PASSWORD, WORKER_HOST, WORKER_PORT } =
  process.env;
const languageFrontendDefault = LanguageCode.en;

export const configProd: VendureConfig = {
  apiOptions: {
    port: 3000,
    adminApiPath: "admin-api",
    shopApiPath: "shop-api",
    adminApiPlayground: {
      settings: { "request.credentials": "include" },
    },
    adminApiDebug: false,
    shopApiPlayground: {
      settings: { "request.credentials": "include" },
    },
    shopApiDebug: false,
    middleware: [],
  },
  defaultLanguageCode: languageFrontendDefault,
  authOptions: {
    tokenMethod: "bearer",
    requireVerification: true,
    superadminCredentials: {
      identifier: SUPERADMIN_USER || "superadmin",
      password: SUPERADMIN_PASSWORD || "superadmin",
    },
  },
  entityIdStrategy: new UuidIdStrategy(),
  dbConnectionOptions: getPostgresDbConfig(),
  paymentOptions: {
    paymentMethodHandlers: [], // it will be populated by plugins
  },
  customFields: {}, // it will be populated by plugins
  logger: new DefaultLogger({
    level: LogLevel.Debug,
    timestamp: false,
  }),
  plugins: [
    AssetServerPlugin.init(getAssetConfig("prod")),
    GoogleStoragePlugin,
    // PubSubPlugin.init(getJobqueueConfig()),
    CloudTasksPlugin.init(getCloudTasksConfig()),
    DefaultSearchPlugin,
    EmailPlugin.init(getEmailConfig("prod")),
    ...customPlugins,
  ],
};
