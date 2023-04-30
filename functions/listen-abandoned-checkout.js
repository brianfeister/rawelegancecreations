const stripe = require('stripe')(process.env.GATSBY_STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
  maxNetworkRetries: 2,
});
const fetch = require('node-fetch');
const { logAndReturnError, logError, config } = require('./utils');

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
      const checkoutSessionExpired = stripeEvent.data.object;
      if (!checkoutSessionExpired?.customer_details?.email) {
        logError(
          `INFO: session did not include email address, cannot send to mailing list`
        );
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: `INFO: session did not include email address, cannot send to mailing list`,
          }),
        };
      }
      try {
        sessionLineItems = await new Promise((resolve, reject) => {
          stripe.checkout.sessions.listLineItems(
            stripeEvent.data.object.id,
            { limit: 1 },
            (err, lineItems) => {
              if (err) {
                return reject(err);
              }
              resolve(lineItems);
            }
          );
        });
      } catch (err) {
        logError(`ERR: Could not retrieve stripe checkout session`, err);
        // return logAndReturnError(`ERR: Could not retrieve stripe checkout session`, err, 400);
      }
      let productFetchCall;
      if (!sessionLineItems?.data?.[0]?.price?.product) {
        logError(`ERR: Could not retrieve stripe product info`, err);
      } else {
        try {
          productFetchCall = await stripe.products.retrieve(
            sessionLineItems?.data?.[0]?.price?.product
          );
        } catch (err) {
          return logAndReturnError(`ERR: Mailerlite signup error`, err, 400);
        }
      }

      // in `create-checkout` we handle the initial subscribing of the user (since
      // some will complete checkout without abandoning) we assume that user is
      // already in the system here and
      try {
        const signupPatchPayload = JSON.stringify({
          ...(checkoutSessionExpired?.customer_details?.name
            ? { name: checkoutSessionExpired?.customer_details?.name }
            : {}),
          type: 'active', // could be 'unconfirmed' for double opt-in
          // ref: https://developers-classic.mailerlite.com/reference/create-a-subscriber
          fields: {
            // TODO: finish this and make conditional + get data from the right place
            abandoned_cart_product_name: productFetchCall?.name,
            abandoned_cart_product_img: productFetchCall?.images?.[0],
            abandoned_checkout_link:
              checkoutSessionExpired?.after_expiration?.recovery?.url,
          },
        });
        console.log('~signupPatchPayload', signupPatchPayload);
        // it should be impossible to trigger this without a customer email,
        // but short circuit just in case
        if (!checkoutSessionExpired?.customer_details?.email) {
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'exiting flow early, no email address provided',
            }),
          };
        }
        signupPatchResponse = await fetch(
          `${config.MAIL_API_ENDPOINT}/subscribers/${checkoutSessionExpired?.customer_details?.email}`,
          {
            headers: new fetch.Headers({
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'X-MailerLite-ApiKey': process.env.MAILERLITE_SECRET,
            }),
            method: 'PUT',
            body: signupPatchPayload,
          }
        );
      } catch (err) {
        return logAndReturnError(`ERR: Mailerlite signup error`, err, 400);
      }
      console.log('~signupPatchResponse', signupPatchResponse);
      // the user is now signed up in the mailing list, add them to the group
      // to trigger the abandoned cart automation flow
      let addToGroupResponse;
      try {
        const signupPayload = JSON.stringify({
          data: {
            email: checkoutSessionExpired?.customer_details?.email,
            resubscribe: false,
            autoresponders: true,
            type: 'active',
          },
        });
        console.log('~signupPayload', signupPayload);
        addToGroupResponse = await fetch(
          `${config.MAIL_API_ENDPOINT}/groups/${config.MAIL_REC_SITE_ABANDONED_SUBSCRIBERS_ID}/subscribers`,
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
