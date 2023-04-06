const stripe = require('stripe')(process.env.GATSBY_STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
  maxNetworkRetries: 2,
});
const fetch = require('node-fetch');
const { logAndReturnError, logError } = require('./utils');

const MAIL_API_ENDPOINT = 'https://api.mailerlite.com/api/v2/subscribers';
const REC_SITE_PROMO_SUBSCRIBERS_ID = '82997463888168093';

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
    return logAndReturnError(
      `ERR: failed to create stripe abandoned cart event`,
      err,
      400
    );
  }

  // Handle the stripeEvent
  let signupPatchResponse;
  let sessionLineItems;
  switch (stripeEvent.type) {
    case 'checkout.session.expired':
      try {
        sessionLineItems = await stripe.checkout.sessions.listLineItems(
          stripeEvent.data.object.id,
          { limit: 1 },
          (err, lineItems) => {
            if (err) {
              return reject(err);
            }
            resolve(lineItems);
          }
        );
      } catch (err) {
        logError(`ERR: Could not retrieve stripe checkout session`, err);
        // return logAndReturnError(`ERR: Could not retrieve stripe checkout session`, err, 400);
      }
      console.log('~sessionLineItems', sessionLineItems);
      try {
        const checkoutSessionExpired = stripeEvent.data.object;

        // this simply makes a patch request to add the user's name if it was
        // provided in the abandoned checkout session
        signupPatchResponse = await fetch(
          `${MAIL_API_ENDPOINT}/${checkoutSessionExpired?.customer_details?.email}`,
          {
            headers: new Headers({
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'X-MailerLite-ApiKey': process.env.MAILERLITE_SECRET,
            }),
            method: 'PUT',
            body: JSON.stringify({
              name: checkoutSessionExpired?.customer_details?.name,
              type: 'active', // could be 'unconfirmed' for double opt-in
              // ref: https://developers-classic.mailerlite.com/reference/create-a-subscriber
              fields: {
                // TODO: finish this and make conditional + get data from the right place
                abandoned_cart_product_name: sessionLineItems?.data?.[0]?.name,
                abandoned_cart_product_img:
                  sessionLineItems?.data?.[0]?.images?.[0],
                abandoned_checkout_link: sessionLineItems?.data?.[0]?.link,
              },
            }),
          }
        );
      } catch (err) {
        return logAndReturnError(`ERR: Mailerlite signup error`, err, 400);
      }
      let addToGroupResponse;
      try {
        addToGroupResponse = await fetch(
          `https://api.mailerlite.com/api/v2/groups/${REC_SITE_PROMO_SUBSCRIBERS_ID}/subscribers`,
          {
            headers: new Headers({
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'X-MailerLite-ApiKey': process.env.MAILERLITE_SECRET,
            }),
            method: 'POST',
            body: JSON.stringify({
              data: {
                email: checkoutSessionExpired?.customer_details?.email,
                resubscribe: false,
                autoresponders: true,
                type: 'active',
              },
            }),
          }
        );
      } catch (err) {
        return logAndReturnError(
          `ERR: Mailerlite add subscriber to group error:`,
          err,
          400
        );
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
