// emailAssetsRelativePath: "../static/email";

import {
  EmailPluginDevModeOptions,
  EmailPluginOptions,
  SMTPTransportOptions,
  EmailEventHandler,
} from "@vendure/email-plugin";
import baseEmailHandlers from "./email/baseEmailHandlers";
import path from "path";
import { Environment } from "./types";

export interface EmailConfigInputs {
  emailAssetsRelativePath: string;
  customEmailHandlers?: Array<EmailEventHandler<any, any>>;
}

export const getEmailConfig: (
  env: Environment
) => EmailPluginOptions | EmailPluginDevModeOptions = (env) => {
  const {
    SHOP_NAME,
    SHOP_EMAIL,
    SITE_URL,
    SENDGRID_KEY,
    MAILGUN_USER,
    MAILGUN_PASSWORD,
  } = process.env;

  const isDev = env == "dev";
  const siteUrl = SITE_URL ?? "http://localhost:3000";
  const templatePath = path.join(__dirname, "../../static/email-templates");
  const testEmailPath = path.join(__dirname, "../../static/dev/test-emails");

  const emailHandlers = baseEmailHandlers;

  const emailTemplateVars = {
    fromAddress: isDev
      ? `"Demo Store" <mail@store.com>`
      : `"${SHOP_NAME}" <${SHOP_EMAIL}>`,
    verifyEmailAddressUrl: `${siteUrl}/verify`,
    passwordResetUrl: `${siteUrl}/reset`,
    changeEmailAddressUrl: `${siteUrl}/address-change`,
    shopName: SHOP_NAME,
  };

  const devEmailPluginConfig: EmailPluginDevModeOptions = {
    devMode: true,
    outputPath: testEmailPath,
    handlers: emailHandlers,
    templatePath,
    globalTemplateVars: emailTemplateVars,
    route: "mailbox",
  };

  const sendGridTransportOptions: SMTPTransportOptions = {
    type: "smtp",
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: SENDGRID_KEY || "",
    },
  };

  const mailgunTransportOptions: SMTPTransportOptions = {
    type: "smtp",
    host: "smtp.eu.mailgun.org",
    port: 587,
    auth: {
      user: MAILGUN_USER || "",
      pass: MAILGUN_PASSWORD || "",
    },
  };

  const prodEmailPluginConfig: EmailPluginOptions = {
    handlers: emailHandlers,
    templatePath,
    globalTemplateVars: emailTemplateVars,
    transport: SENDGRID_KEY
      ? sendGridTransportOptions
      : mailgunTransportOptions,
  };

  return isDev ? devEmailPluginConfig : prodEmailPluginConfig;
};
