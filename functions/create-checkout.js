// TODO: update to node16 and latest netlify cli
const fetch = require('node-fetch');

/*
 * This function creates a Stripe Checkout session and returns the session ID
 * for use with Stripe.js (specifically the redirectToCheckout method).
 *
 * Notably, this function has other side-effects and can create a
 * Stripe customer, a promo code for that custoemr, etc.
 *
 * @see https://stripe.com/docs/payments/checkout/one-time
 */
const stripe = require('stripe')(process.env.GATSBY_STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
  maxNetworkRetries: 2,
});

exports.handler = async event => {
  let session;
  try {
    const body = JSON.parse(event.body);
    let customer;
    let isNewCustomer;
    // TODO: verify that no customer is created (only a guest session)
    // if body.consent is unchecked
    if (body.email && body.consent) {
      // this is questionable in terms of API optimization
      // on one hand, we don't want to have another database
      // and API, on the other, Stripe allows many `customers`
      // with the same email address. Their docs also caveat
      // that this search API can take up to 60s ~ hours to
      // update, so a new customer could wind up with 2 accounts
      // seems an acceptable trade-off now while total customers
      // are low and reconciliation of dupes can happen manually
      const customerSearch = await stripe.customers.search({
        query: `email:'${body.email}'`,
      });
      if (customerSearch?.data?.[0]) {
        customer = customerSearch?.data?.[0];
      } else {
        isNewCustomer = true;
        customer = await stripe.customers.create({
          email: body.email,
          metadata: { promotional_consent: 'yes' },
        });
      }
    }

    // async handoff to the first-time customer promo code process
    // for now, we have Stripe handling that only registered users
    // who are first-time can use this code, but we might do this
    // in serial if we need

    // const promoURL =
    //   process.env.URL + '/.netlify/functions/create-new-customer-promo';

    // const promoCode = await fetch(promoURL, {
    //   method: 'POST',
    //   body: JSON.stringify({ customer: customer }),
    // })

    const items = body.cart.map(item => ({
      price_data: {
        currency: 'usd',
        unit_amount: item.unit_amount,
        tax_behavior: 'exclusive',
        product_data: {
          name: item.name,
          description: item.description,
          images: item.images,
          metadata: {
            // sending as metadata creates a link to the price
            // stripe doesn't show robust analytics by default
            // this should suffice for later queries by metadata
            price_id: item.price_id,
          },
        },
      },
      quantity: item.quantity,
    }));

    // API Docs https://stripe.com/docs/api/checkout/sessions/create
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      ...(customer
        ? {
            // if the code has already been redeemed, stripe errors
            // on session creation, only new customers automatically
            // get `RECVIP10` populated, others need to handle manually
            ...(isNewCustomer
              ? {
                  discounts: [
                    {
                      // correlates to `RECVIP10`
                      promotion_code: 'promo_1MiA3cGMmCGYFAdvmVnECjnj',
                    },
                  ],
                }
              : { allow_promotion_codes: true }),
            customer: customer.id,
            customer_update: {
              shipping: 'auto',
            },
            // Enable to show consent on checkout. Not needed since we
            // have collected consent on the prior page (the checkout
            // summary before transferring to stripe session)

            // consent_collection: {
            //   promotions: 'auto',
            // },

            // enable webhook to trigger abandoned cart webhook
            after_expiration: {
              recovery: {
                enabled: true,
                allow_promotion_code: true,

                // disabled in favor of hardcoded `RECVIP10`
                // ... but is there a chance of race condition
                // with new promo creation?

                // allow_promotion_codes: true,
              },
            },
          }
        : {
            ...(body.email ? { customer_email: body.email } : {}),
            allow_promotion_codes: true,
          }),
      automatic_tax: {
        enabled: true,
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 2, // Configured to expire after 2 hours
      /*
       * This env var is set by Netlify and inserts the live site URL. If you want
       * to use a different URL, you can hard-code it here or check out the
       * other environment variables Netlify exposes:
       * https://docs.netlify.com/configure-builds/environment-variables/
       */
      success_url: `${process.env.URL}/checkout?checkout=success`,
      cancel_url: `${process.env.URL}/checkout`,
      line_items: items,
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free shipping',
            tax_behavior: 'exclusive',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
      ],
      // We are using the metadata to track which items were purchased.
      // We can access this meatadata in our webhook handler to then handle
      // the fulfillment process.
      // In a real application you would track this in an order object in your database.
      // metadata: {
      // NOTE: 500 character stringified JSON limit
      //   items: JSON.stringify(items),
      // },
    });
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      sessionId: session.id,
      publishableKey: process.env.GATSBY_STRIPE_PUBLISHABLE_KEY,
    }),
  };
};