import { AdminUiPluginOptions } from "@vendure/admin-ui-plugin";
import { LanguageCode } from "@vendure/core";
import { Environment } from "./types";
import path from "path";
import { compileAdminUi } from "./compile-admin-ui";

export const adminUiOutputPath = path.resolve(__dirname, "../../admin");

export const getAdminConfig: (env: Environment) => AdminUiPluginOptions = (
  env
) => {
  return {
    port: 3002,
    app: compileAdminUi({
      recompile: env == "dev",
      env,
      adminUiOutputPath,
    }),
    adminUiConfig: {
      defaultLanguage: LanguageCode.it,
      availableLanguages: [LanguageCode.it, LanguageCode.en],
    },
    route: "admin", // set to root instead of admin, as we use custom subdomain
  };
};
