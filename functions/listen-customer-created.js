const stripe = require('stripe')(process.env.GATSBY_STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
  maxNetworkRetries: 2,
});
const MailerLite = require('@mailerlite/mailerlite-nodejs').default;
const mailerlite = new MailerLite({
  api_key: process.env.MAILERLITE_SECRET,
});
const { logAndReturnError, config, log } = require('./utils');

exports.handler = async event => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = await stripe.webhooks.constructEvent(
      event.body, // stripe needs the unparsed body
      sig,
      process.env.STRIPE_CUSTOMER_CREATED_WEBHOOK_SECRET
    );
  } catch (err) {
    log(`ERR: failed to create stripe abandoned cart event: ${err}`);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Webhook Error: ${err.message}`,
      }),
    };
  }

  // Handle the stripeEvent
  let signupResponse;
  switch (stripeEvent.type) {
    case 'customer.created':
      const customerCreatedEvent = stripeEvent.data.object;
      console.log(
        '~customer.created customerCreatedEvent \n',
        customerCreatedEvent
      );
      if (!customerCreatedEvent?.email) {
        const msg =
          'exiting early, no email in stripe customer.created webhook event body';
        log(msg);
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: msg,
          }),
        };
      }
      if (customerCreatedEvent?.metadata?.promotional_consent !== 'yes') {
        const msg = `exiting early, metadata.promotional_consent !== 'yes'`;
        log(msg);
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: msg,
          }),
        };
      }
      try {
        // trigger signup and add to the base config.MAIL_REC_SITE_VIP_SUBSCRIBERS_ID
        // mailing list
        signupResponse = await mailerlite.subscribers.createOrUpdate({
          email: customerCreatedEvent.email,
          ...(customerCreatedEvent?.name
            ? {
                name: customerCreatedEvent?.name,
              }
            : {}),
          type: 'active', // could be 'unconfirmed' for double opt-in
          // ref: https://developers-classic.mailerlite.com/reference/create-a-subscriber
          groups: [config.MAIL_REC_SITE_VIP_SUBSCRIBERS_ID],
        });
      } catch (err) {
        return logAndReturnError(`ERR: Mailerlite signup error`, err);
      }
      break;
    // ... handle other stripeEvent types
    default:
      log(`ERR: Unhandled stripeEvent type ${stripeEvent.type}`);
  }
  log(`SUCCESS: created mailerlite: ${JSON.stringify(signupResponse)}}`);
  return {
    statusCode: 200,
    body: JSON.stringify(signupResponse),
  };
};
