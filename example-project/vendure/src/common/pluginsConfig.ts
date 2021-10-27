import { BraintreePlugin } from "@artcoded/vendure-braintree-plugin";
import { ExtendedShipmentsPlugin } from "@artcoded/vendure-extended-shipments-plugin";
import { FeaturedPlugin } from "@artcoded/vendure-featured-plugin";
import { SeoPlugin } from "@artcoded/vendure-seo-plugin";
import { Extension } from "@vendure/ui-devkit/compiler";

export const customPlugins = [
  BraintreePlugin,
  ExtendedShipmentsPlugin,
  FeaturedPlugin,
  SeoPlugin,
];

export const getAdminUiExtensions = () => {
  let extensions: Extension[] = [];
  customPlugins.forEach((p) => {
    if ((p as any).uiExtension) extensions.push((p as any).uiExtension);
  });
  return extensions;
};
