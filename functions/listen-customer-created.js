const stripe = require('stripe')(process.env.GATSBY_STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
  maxNetworkRetries: 2,
});
const fetch = require('node-fetch');
const { logAndReturnError, config } = require('./utils');

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
      console.log(
        '~customer.created stripeEvent.data.object \n',
        stripeEvent.data.object
      );
      // TODO: delete early return
      return {
        statusCode: 200,
        body: JSON.stringify(stripeEvent.data.object),
      };
      try {
        // TODO: what follows is mostly a flow that needs to trigger on
        // stripe's `customer:created` webhook
        // this really should just be a flow that says
        // "send an email - 'hey did you still want to buy this?' "
        await fetch(config.MAIL_API_ENDPOINT, {
          headers: new fetch.Headers({
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-MailerLite-ApiKey': process.env.MAILERLITE_SECRET,
          }),
          method: 'POST',
          body: JSON.stringify({
            email: body.email,
            name: checkoutSessionExpired?.customer_details?.name,
            type: 'active', // could be 'unconfirmed' for double opt-in
            // ref: https://developers-classic.mailerlite.com/reference/create-a-subscriber
          }),
        });
      } catch (err) {
        return logAndReturnError(`ERR: Mailerlite signup error`, err);
      }

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
