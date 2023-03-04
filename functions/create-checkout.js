/*
 * This function creates a Stripe Checkout session and returns the session ID
 * for use with Stripe.js (specifically the redirectToCheckout method).
 *
 * @see https://stripe.com/docs/payments/checkout/one-time
 */
const stripe = require('stripe')(process.env.GATSBY_STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
  maxNetworkRetries: 2,
});

exports.handler = async event => {
  const items = JSON.parse(event.body).map(item => ({
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
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: ['US', 'CA'],
    },
    allow_promotion_codes: true,
    consent_collection: {
      promotions: 'auto',
    },
    automatic_tax: {
      enabled: true,
    },
    /*
     * This env var is set by Netlify and inserts the live site URL. If you want
     * to use a different URL, you can hard-code it here or check out the
     * other environment variables Netlify exposes:
     * https://docs.netlify.com/configure-builds/environment-variables/
     */
    success_url: `${process.env.URL}/checkout?checkout=success`,
    cancel_url: `${process.env.URL}/checkout`,
    line_items: items,
    // We are using the metadata to track which items were purchased.
    // We can access this meatadata in our webhook handler to then handle
    // the fulfillment process.
    // In a real application you would track this in an order object in your database.
    // metadata: {
    // NOTE: 500 character stringified JSON limit
    //   items: JSON.stringify(items),
    // },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    }),
  };
};
