// const devAssetFolder = path.resolve(__dirname, "../static/dev/assets");

import { AssetServerOptions } from "@vendure/asset-server-plugin";
import { DefaultAssetNamingStrategy } from "@vendure/core";
import path from "path";
import { Environment } from "./types";
import { GoogleStorageStrategy } from "@artcoded/gcp-asset-server-plugin";

export const getAssetConfig = (env: Environment) => {
  const devAssetStrategyConfig: AssetServerOptions = {
    route: "assets",
    assetUploadDir: path.join(__dirname, "../../static/dev/assets"),
  };

  const prodAssetStrategyConfig: AssetServerOptions = {
    route: "assets",
    assetUploadDir: "",
    namingStrategy: new DefaultAssetNamingStrategy(),
    storageStrategyFactory: (options: AssetServerOptions) =>
      new GoogleStorageStrategy({
        bucketName: process.env.GCP_ASSET_BUCKET || "",
        cdnUrl: `https://${process.env.ASSETS_CDN_DOMAIN}`,
      }),
  };

  return env == "dev" ? devAssetStrategyConfig : prodAssetStrategyConfig;
};
