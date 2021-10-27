import { orderConfirmationHandlers } from "./orderConfirmationHandlers";
import { defaultEmailHandlers } from "./localizedDefaultHandlers";
import { EmailEventHandler } from "@vendure/email-plugin";

const baseEmailHandlers: Array<EmailEventHandler<any, any>> = [...defaultEmailHandlers, ...orderConfirmationHandlers];

export default baseEmailHandlers;