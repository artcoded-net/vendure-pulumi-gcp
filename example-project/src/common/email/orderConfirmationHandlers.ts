/* tslint:disable:no-non-null-assertion */
import { OrderStateTransitionEvent, LanguageCode, ShippingMethod, TransactionalConnection } from '@vendure/core';
import { EmailEventListener, EmailEventHandler } from '@vendure/email-plugin';
import { mockOrderStateTransitionEvent } from '@vendure/email-plugin/lib/src/mock-events';

const shopEmail = process.env.SHOP_EMAIL || 'dev@artcoded.net';

const orderConfirmationHandler = new EmailEventListener('order-confirmation')
    .on(OrderStateTransitionEvent)
    .filter(
        event =>
            event.toState === 'PaymentAuthorized' && event.fromState !== 'Modifying' && !!event.order.customer,
    )
    .loadData(async context => {
        const shippingMethods: ShippingMethod[] = [];

        for (const line of context.event.order.shippingLines || []) {
            let shippingMethod: ShippingMethod | undefined;
            if (!line.shippingMethod && line.shippingMethodId) {
                shippingMethod = await context.injector
                    .get(TransactionalConnection)
                    .getRepository(ShippingMethod)
                    .findOne(line.shippingMethodId);
            } else if (line.shippingMethod) {
                shippingMethod = line.shippingMethod;
            }
            if (shippingMethod) {
                shippingMethods.push(shippingMethod);
            }
        }

        return { shippingMethods };
    })
    .setRecipient(event => event.order.customer!.emailAddress)
    .setFrom(`{{ fromAddress }}`)
    .setSubject(`Order confirmation for #{{ order.code }}`)
    .setTemplateVars(event => ({ order: event.order, shippingMethods: event.data.shippingMethods }))
    .setMockEvent(mockOrderStateTransitionEvent);

const localizedOrderConfirmationHandler = orderConfirmationHandler
.addTemplate({
    channelCode: 'default',
    languageCode: LanguageCode.it,
    templateFile: 'body.it.hbs',
    subject: 'Conferma ordine numero #{{ order.code }}',
})

export const newOrderNotificationHandler = new EmailEventListener('new-order-notification')
    .on(OrderStateTransitionEvent)
    .filter(event => event.toState === 'PaymentAuthorized' && event.fromState !== 'Modifying' && !!event.order.customer)
    .loadData(async context => {
        const shippingMethods: ShippingMethod[] = [];
        for (const line of context.event.order.shippingLines || []) {
            let shippingMethod: ShippingMethod | undefined;
            if (!line.shippingMethod && line.shippingMethodId) {
                shippingMethod = await context.injector
                    .get(TransactionalConnection)
                    .getRepository(ShippingMethod)
                    .findOne(line.shippingMethodId);
            } else if (line.shippingMethod) {
                shippingMethod = line.shippingMethod;
            }
            if (shippingMethod) {
                shippingMethods.push(shippingMethod);
            }
        }

        return { shippingMethods };
    })
    .setRecipient((event: any) => shopEmail)
    .setFrom(`{{ fromAddress }}`)
    .setSubject(`Order received with #{{ order.code }}`)
    .setTemplateVars(event => ({ order: event.order, shippingMethods: event.data.shippingMethods }))
    .setMockEvent(mockOrderStateTransitionEvent);

const localizedNewOrderNotificationHandler = newOrderNotificationHandler
    .addTemplate({
      channelCode: 'default',
      languageCode: LanguageCode.it,
      templateFile: 'body.it.hbs',
      subject: 'Ricevuto ordine numero #{{ order.code }}',
});

export const orderShippedHandler = new EmailEventListener('order-shipped')
    .on(OrderStateTransitionEvent)
    .filter(
        event =>
            event.toState === 'Shipped' && event.fromState !== 'Modifying' && !!event.order.customer,
    )
    .loadData(async context => {
        const shippingMethods: ShippingMethod[] = [];
        for (const line of context.event.order.shippingLines || []) {
            let shippingMethod: ShippingMethod | undefined;
            if (!line.shippingMethod && line.shippingMethodId) {
                shippingMethod = await context.injector
                    .get(TransactionalConnection)
                    .getRepository(ShippingMethod)
                    .findOne(line.shippingMethodId);
            } else if (line.shippingMethod) {
                shippingMethod = line.shippingMethod;
            }
            if (shippingMethod) {
                shippingMethods.push(shippingMethod);
            }
        }
        return { shippingMethods };
    })
    .setRecipient(event => event.order.customer!.emailAddress)
    .setFrom(`{{ fromAddress }}`)
    .setSubject(`Your order has been shipped`)
    .setTemplateVars(event => ({ order: event.order, shippingMethods: event.data.shippingMethods }))
    .setMockEvent(mockOrderStateTransitionEvent);

const localizedOrderShippedHandler = orderShippedHandler
    .addTemplate({
      channelCode: 'default',
      languageCode: LanguageCode.it,
      templateFile: 'body.it.hbs',
      subject: "Il tuo ordine è stato spedito",
});

export const orderDeliveredHandler = new EmailEventListener('order-delivered')
    .on(OrderStateTransitionEvent)
    .filter(
        event =>
            event.toState === 'Delivered' && event.fromState !== 'Modifying' && !!event.order.customer,
    )
    .loadData(async context => {
        const shippingMethods: ShippingMethod[] = [];
        for (const line of context.event.order.shippingLines || []) {
            let shippingMethod: ShippingMethod | undefined;
            if (!line.shippingMethod && line.shippingMethodId) {
                shippingMethod = await context.injector
                    .get(TransactionalConnection)
                    .getRepository(ShippingMethod)
                    .findOne(line.shippingMethodId);
            } else if (line.shippingMethod) {
                shippingMethod = line.shippingMethod;
            }
            if (shippingMethod) {
                shippingMethods.push(shippingMethod);
            }
        }
        return { shippingMethods };
    })
    .setRecipient(event => event.order.customer!.emailAddress)
    .setFrom(`{{ fromAddress }}`)
    .setSubject(`Your order has been delivered`)
    .setTemplateVars(event => ({ order: event.order, shippingMethods: event.data.shippingMethods }))
    .setMockEvent(mockOrderStateTransitionEvent);

const localizedOrderDeliveredHandler = orderDeliveredHandler
    .addTemplate({
      channelCode: 'default',
      languageCode: LanguageCode.it,
      templateFile: 'body.it.hbs',
      subject: "Il tuo ordine è stato consegnato",
});

export const orderConfirmationHandlers: Array<EmailEventHandler<any, any>> = [
    localizedOrderConfirmationHandler,
    localizedNewOrderNotificationHandler,
    localizedOrderShippedHandler,
    localizedOrderDeliveredHandler
];
