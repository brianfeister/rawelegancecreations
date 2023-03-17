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
    console.log(
      `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} ERR: failed to create stripe abandoned cart event: ${err}`
    );
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
  console.log(
    `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} SUCCESS: created stripe abandoned cart event: ${err} ${JSON.stringify(
      stripeEvent.data.object
    )}}`
  );
  return {
    statusCode: 200,
    body: JSON.stringify(stripeEvent.data.object),
  };
};
