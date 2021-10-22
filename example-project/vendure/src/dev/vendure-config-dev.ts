import {
  VendureConfig,
  DefaultLogger,
  LogLevel,
  DefaultJobQueuePlugin,
  UuidIdStrategy,
  LanguageCode,
  DefaultSearchPlugin,
} from "@vendure/core";
import { EmailPlugin } from "@vendure/email-plugin";
import { getAssetConfig } from "../common/assets-config";
import { customPlugins } from "../common/pluginsConfig";
import { getEmailConfig } from "../common/email-config";
import { AssetServerPlugin } from "@vendure/asset-server-plugin";
import { AdminUiPlugin } from "@vendure/admin-ui-plugin";
import { getAdminConfig } from "../common/admin-config";
import { localRemoteDbConfig } from "./local/db-config-local";

const languageFrontendDefault = LanguageCode.en;

export const configDev: VendureConfig = {
  apiOptions: {
    port: 3000,
    adminApiPath: "admin-api",
    shopApiPath: "shop-api",
    adminApiPlayground: {
      settings: { "request.credentials": "include" },
    },
    adminApiDebug: true,
    shopApiPlayground: {
      settings: { "request.credentials": "include" },
    },
    shopApiDebug: true,
    middleware: [],
  },
  defaultLanguageCode: languageFrontendDefault,
  authOptions: {
    tokenMethod: "bearer",
    requireVerification: true,
    superadminCredentials: {
      identifier: "superadmin",
      password: "superadmin",
    },
  },
  entityIdStrategy: new UuidIdStrategy(),
  dbConnectionOptions: localRemoteDbConfig,
  paymentOptions: {
    paymentMethodHandlers: [], // it will be populated by plugins
  },
  customFields: {}, // it will be populated by plugins
  logger: new DefaultLogger({
    level: LogLevel.Debug,
    timestamp: true,
  }),
  plugins: [
    AssetServerPlugin.init(getAssetConfig("dev")),
    DefaultJobQueuePlugin,
    DefaultSearchPlugin,
    EmailPlugin.init(getEmailConfig("dev")),
    AdminUiPlugin.init(getAdminConfig("dev")),
    ...customPlugins,
  ],
};
