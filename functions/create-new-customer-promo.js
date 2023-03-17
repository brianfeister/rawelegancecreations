/*
 * This function creates a promo code and emails it to a new customer
 */

const stripe = require('stripe')(process.env.GATSBY_STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
  maxNetworkRetries: 2,
});

exports.handler = async event => {
  let promotionCode;
  try {
    const body = JSON.parse(event.body);
    promotionCode = await stripe.promotionCodes.create({
      // correlates to `First time buyer - RECVIP10` in Stripe
      // https://dashboard.stripe.com/test/coupons/ruRd45BT
      coupon: 'VWcZtSOZ',
      code: 'RECVIP10',
      // limits the code redemption to only the specified custoemer
      customer: body?.customer?.id,
      max_redemptions: 1,
    });
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
      }),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      promotionCode,
    }),
  };
};
