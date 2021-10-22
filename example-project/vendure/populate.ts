/* eslint-disable @typescript-eslint/no-var-requires */
import { mergeConfig, defaultConfig, bootstrap } from "@vendure/core";
import { populate } from "@vendure/core/cli";
import { configProd } from "./src/config/vendure-config-prod";
import {
  ProductCustomFields,
  VariantCustomFields,
} from "./static/initial-data/initial-custom-fields";
import { clearAllTables, populateCustomers } from "@vendure/testing";
import path from "path";
import { AdminUiPlugin } from "@vendure/admin-ui-plugin";

const resolveFromCreatePackage = (target: string) =>
  path.join(path.dirname(require.resolve("@vendure/create")), target);

// tslint:disable:no-console

/**
 * A CLI script which populates the database with some sample data
 */
if (require.main === module) {
  // Running from command line

  const populateConfig = mergeConfig(
    defaultConfig,
    mergeConfig(configProd, {
      authOptions: {
        tokenMethod: "bearer",
        requireVerification: false,
      },
      importExportOptions: {
        importAssetsDir: resolveFromCreatePackage("assets/images"),
      },
      customFields: {
        Product: ProductCustomFields,
        ProductVariant: VariantCustomFields,
      },
      plugins: configProd.plugins!.filter(
        (plugin: any) => plugin !== AdminUiPlugin
      ), // excluding AdminUi
    })
  );

  clearAllTables(populateConfig, true)
    .then(() =>
      populate(
        // using default data
        () => bootstrap(populateConfig),
        resolveFromCreatePackage("assets/initial-data.json"),
        resolveFromCreatePackage("assets/products.csv")
      )
    )
    .then(async (app) => {
      console.log("Populating customers...");
      await populateCustomers(10, populateConfig as any, true);
      return app.close();
    })
    .then(
      () => process.exit(0),
      (err) => {
        console.log(err);
        process.exit(1);
      }
    );
}
