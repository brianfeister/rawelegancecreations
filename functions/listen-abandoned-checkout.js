const stripe = require('stripe')(process.env.GATSBY_STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
  maxNetworkRetries: 2,
});
const MailerLite = require('@mailerlite/mailerlite-nodejs').default;
const mailerlite = new MailerLite({
  api_key: process.env.MAILERLITE_SECRET,
});

const { logAndReturnError, log, config } = require('./utils');

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
  let signupPutResponse;
  let sessionLineItems;
  switch (stripeEvent.type) {
    case 'checkout.session.expired':
      const checkoutSessionExpired = stripeEvent.data.object;
      if (!checkoutSessionExpired?.customer_details?.email) {
        log(
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
        log(`ERR: Could not retrieve stripe checkout session`, err);
        // return logAndReturnError(`ERR: Could not retrieve stripe checkout session`, err, 400);
      }
      let productFetchCall;
      if (!sessionLineItems?.data?.[0]?.price?.product) {
        log(`ERR: Could not retrieve stripe product info`, err);
      } else {
        try {
          productFetchCall = await stripe.products.retrieve(
            sessionLineItems?.data?.[0]?.price?.product
          );
        } catch (err) {
          return logAndReturnError(
            `ERR: Stripe products lineItems fetch error`,
            err,
            400
          );
        }
      }

      // it should be impossible to trigger this flow in the first place
      // without a customer email, but short circuit here just in case
      if (!checkoutSessionExpired?.customer_details?.email) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'exiting flow early, no email address provided',
          }),
        };
      }

      // in `create-checkout` we handle the initial subscribing of the user (since
      // some will complete checkout without abandoning) we assume that user is
      // already in the system here, but first we need to fetch user ID
      console.log('~95');
      let existingEmailUser;
      try {
        existingEmailUser = await mailerlite.subscribers.get(
          checkoutSessionExpired?.customer_details?.email
        );
      } catch (err) {
        return logAndReturnError(`ERR: Mailerlite can't fetch`, err, 400);
      }
      console.log('~104 existingEmailUser', existingEmailUser);
      // TODO: if existingEmailUser spread (...) `group: []` in mailerlite.subscribers.createOrUpdate()
      // otherwise just declare value of config.MAIL_REC_SITE_ABANDONED_SUBSCRIBERS_ID
      const payload = {
        email: checkoutSessionExpired?.customer_details?.email,
        ...(checkoutSessionExpired?.customer_details?.name ||
        existingEmailUser?.data?.name
          ? {
              name:
                checkoutSessionExpired?.customer_details?.name ||
                existingEmailUser?.data?.name,
            }
          : {}),
        type: 'active', // could be 'unconfirmed' for double opt-in
        ...(existingEmailUser?.data?.groups?.length
          ? // the user has already signed up, preserve existing
            // group subscriptions and add them to to
            // config.MAIL_REC_SITE_ABANDONED_SUBSCRIBERS_ID
            // to trigger the abandoned cart automation flow
            {
              groups: [
                ...existingEmailUser?.data?.groups,
                config.MAIL_REC_SITE_ABANDONED_SUBSCRIBERS_ID,
              ],
            }
          : { groups: [config.MAIL_REC_SITE_ABANDONED_SUBSCRIBERS_ID] }),
        // these are used by the mailing list automation
        fields: {
          abandoned_cart_product_name: productFetchCall?.name,
          abandoned_cart_product_img: productFetchCall?.images?.[0],
          abandoned_checkout_link:
            checkoutSessionExpired?.after_expiration?.recovery?.url,
        },
      };
      console.log('~mailerlite payload', payload);
      const updateMailUserResponse = await mailerlite.subscribers.createOrUpdate(
        payload
      );
      console.log('~139');
      try {
        console.log('~signupPutPayload', signupPutPayload);
        signupPutResponse = await mailerlite.subscribers.createOrUpdate({
          email: checkoutSessionExpired?.customer_details?.email,
        });
      } catch (err) {
        return logAndReturnError(`ERR: Mailerlite signup error`, err, 400);
      }
      break;
    // ... handle other stripeEvent types
    default:
      log(`ERR: Unhandled stripeEvent type ${stripeEvent.type}`);
  }
  log(
    `SUCCESS: created stripe abandoned cart event: ${JSON.stringify(
      stripeEvent.data.object
    )}}`
  );
  return {
    statusCode: 200,
    body: JSON.stringify(stripeEvent.data.object),
  };
};
