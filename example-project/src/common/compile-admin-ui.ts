import { compileUiExtensions } from "@vendure/ui-devkit/compiler";
import path from "path";
import { adminUiOutputPath } from "./admin-config";
import { getAdminUiExtensions } from "./pluginsConfig";
import { Environment } from "./types";

export const compileAdminUi = (options: {
  env?: Environment;
  recompile: boolean;
  adminUiOutputPath: string;
}) => {
  const { recompile, env, adminUiOutputPath } = options;
  if (recompile) {
    return compileUiExtensions({
      outputPath: adminUiOutputPath,
      extensions: getAdminUiExtensions(),
      devMode: !env || env == "dev",
    });
  } else {
    return {
      path: path.join(adminUiOutputPath, "dist"),
    };
  }
};

if (require.main === module) {
  compileAdminUi({ recompile: true, adminUiOutputPath, env: "prod" })
    .compile?.()
    .then(() => {
      process.exit(0);
    });
}
