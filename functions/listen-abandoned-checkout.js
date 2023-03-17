// server.js
//
// Use this sample code to handle webhook events in your integration.
//
// 1) Paste this code into a new file (server.js)
//
// 2) Install dependencies
//   npm install stripe
//   npm install express
//
// 3) Run the server on http://localhost:4242
//   node server.js

const stripe = require('stripe')(process.env.GATSBY_STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
  maxNetworkRetries: 2,
});

exports.handler = async event => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = await stripe.webhooks.constructEvent(
      event.body, // stripe needs the unparsed body
      sig,
      process.env.STRIPE_ABANDONED_CHECKOUT_WEBHOOK_SECRET
    );
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Webhook Error: ${err.message}`,
      }),
    };
    return;
  }

  console.log('~stripeEvent', stripeEvent);
  // Handle the stripeEvent
  switch (stripeEvent.type) {
    case 'checkout.session.expired':
      const checkoutSessionExpired = stripeEvent.data.object;
      // Then define and call a function to handle the stripeEvent checkout.session.expired
      break;
    // ... handle other stripeEvent types
    default:
      console.log(`Unhandled stripeEvent type ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(stripeEvent.data.object),
  };
};
