const stripe = require('stripe')(process.env.GATSBY_STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
  maxNetworkRetries: 2,
});
const fetch = require('node-fetch');
const { logAndReturnError, config, logError } = require('./utils');

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
    console.log(
      `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} ERR: failed to create stripe abandoned cart event: ${err}`
    );
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
        logError(msg);
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: msg,
          }),
        };
      }
      if (customerCreatedEvent?.metadata?.promotional_consent !== 'yes') {
        const msg = `exiting early, metadata.promotional_consent !== 'yes'`;
        logError(msg);
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: msg,
          }),
        };
      }

      // TODO: delete early return
      // return {
      //   statusCode: 200,
      //   body: JSON.stringify(stripeEvent.data.object),
      // };
      try {
        // TODO: what follows is mostly a flow that needs to trigger on
        // stripe's `customer:created` webhook
        // this really should just be a flow that says
        // "send an email - 'hey did you still want to buy this?' "
        const signupPostRequest = await fetch(
          `${config.MAIL_API_ENDPOINT}/subscribers/${customerCreatedEvent.email}`,
          {
            headers: new fetch.Headers({
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'X-MailerLite-ApiKey': process.env.MAILERLITE_SECRET,
            }),
            method: 'POST',
            body: JSON.stringify({
              email: customerCreatedEvent.email,
              ...(customerCreatedEvent?.name
                ? {
                    name: customerCreatedEvent?.name,
                  }
                : {}),
              type: 'active', // could be 'unconfirmed' for double opt-in
              // ref: https://developers-classic.mailerlite.com/reference/create-a-subscriber
            }),
          }
        );
      } catch (err) {
        return logAndReturnError(`ERR: Mailerlite signup error`, err);
      }

      let addToGroupResponse;
      try {
        const signupPayload = JSON.stringify({
          data: {
            email: customerCreatedEvent.email,
            resubscribe: false,
            autoresponders: true,
            type: 'active',
          },
        });
        console.log('~signupPayload', signupPayload);
        addToGroupResponse = await fetch(
          `${config.MAIL_API_ENDPOINT}/groups/${config.MAIL_REC_SITE_VIP_SUBSCRIBERS_ID}/subscribers`,
          {
            headers: new fetch.Headers({
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'X-MailerLite-ApiKey': process.env.MAILERLITE_SECRET,
            }),
            method: 'POST',
            body: signupPayload,
          }
        );
      } catch (err) {
        return logAndReturnError(
          `ERR: Mailerlite add subscriber to group error:`,
          err,
          400
        );
      }
      console.log('~addToGroupResponse', addToGroupResponse);

      break;
    // ... handle other stripeEvent types
    default:
      console.log(
        `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} Unhandled stripeEvent type ${
          stripeEvent.type
        }`
      );
  }
  console.log(
    `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} SUCCESS: created stripe abandoned cart event: ${JSON.stringify(
      stripeEvent.data.object
    )}}`
  );
  return {
    statusCode: 200,
    body: JSON.stringify(stripeEvent.data.object),
  };
};
