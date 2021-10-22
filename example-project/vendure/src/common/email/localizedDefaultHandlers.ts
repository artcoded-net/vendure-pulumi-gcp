/* tslint:disable:no-non-null-assertion */
import { LanguageCode } from '@vendure/core';
import { emailAddressChangeHandler, emailVerificationHandler, passwordResetHandler, EmailEventHandler } from '@vendure/email-plugin';

// Italian default templates

const localizedEmailVerificationHandler = emailVerificationHandler
    .addTemplate({
        channelCode: 'default',
        languageCode: LanguageCode.it,
        templateFile: 'body.it.hbs',
        subject: 'Verifica il tuo indirizzo email',
    });

const localizedPasswordResetHandler = passwordResetHandler
    .addTemplate({
        channelCode: 'default',
        languageCode: LanguageCode.it,
        templateFile: 'body.it.hbs',
        subject: 'Reimposta la password dimenticata',
    });

const localizedEmailAddressChangeHandler = emailAddressChangeHandler
    .addTemplate({
        channelCode: 'default',
        languageCode: LanguageCode.it,
        templateFile: 'body.it.hbs',
        subject: 'Verifica il tuo nuovo indirizzo email',
    });


export const defaultEmailHandlers: Array<EmailEventHandler<any, any>> = [
    localizedEmailVerificationHandler,
    localizedPasswordResetHandler,
    localizedEmailAddressChangeHandler,
];
