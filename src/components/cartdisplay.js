import React, { useContext, useEffect, useState } from 'react';
import getStripe from '../utils/stripejs';
import { Link } from 'gatsby';
import { formatPrice } from '../helpers/currency-filter';
import { CartContext } from '../context/cart';
import {
  Table,
  TR,
  TH,
  TD,
  ProductName,
  ProductImg,
  Payment,
} from './cartdisplay-styles';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';

const VariantRows = ({ variants, removeFromCart }) =>
  variants.map(variant => {
    if (!(variant.quantity > 0)) return null;
    return (
      <TR key={variant.id}>
        <TD className="variant">{variant?.nickname}</TD>
        <TD>
          <h4 className="price">{formatPrice(variant?.unit_amount)}</h4>
        </TD>
        <TD>
          <strong>{variant.quantity}</strong>
        </TD>
        <TD>{formatPrice(variant?.unit_amount * variant.quantity)}</TD>
        <TD
          className="remove"
          onClick={e => {
            removeFromCart(variant.id);
          }}
        >
          {' '}
          <a onClick={() => false}>Remove</a>
        </TD>
      </TR>
    );
  });

export const getSubtotalOfAllVariants = ({ cart }) => {
  let subtotal = 0;
  cart.forEach(item => {
    item.prices.forEach(price => {
      if (price.quantity >= 1) {
        subtotal += price.unit_amount * price.quantity;
      }
    });
  });
  return subtotal;
};

const getMappedCart = ({ cart }) => {
  let mappedCart = [];
  cart.forEach(item => {
    item.prices.forEach(price => {
      if (price.quantity > 0 && price.active) {
        mappedCart.push({
          unit_amount: price.unit_amount,
          price_id: price.id,
          quantity: price.quantity,
          description: item.description,
          images: item.images,
          name: `${item.name}${
            price?.nickname ? ' (' + price.nickname + ')' : ''
          }`,
        });
      }
    });
  });
  return mappedCart;
};

const CartDisplay = () => {
  const [cart, updateCart] = useContext(CartContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const removeFromCart = id => {
    // in stripe's products API, we have prod_ for products
    let _cart = [].concat(cart);
    if (id.match('prod_')?.length > 0) {
      _cart = cart.filter(item => item.id !== id);
      // ... and price_ for price variants, here we remove only the variant
    } else {
      _cart.forEach((item, index, array) => {
        item.prices.forEach((price, priceIndex, priceArray) => {
          if (id === price.id) {
            price.quantity = 0;
          }
        });
        if (item.prices?.length === 0) {
          array.splice(index, 1);
        }
      });
    }
    updateCart(_cart);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const form = new FormData(event.target);
    setLoading(true);
    const response = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cart: getMappedCart({ cart }),
        consent: !!form.get('consent'),
        email: form.get('email'),
      }),
    }).then(res => res.json());
    const stripe = await getStripe();
    const { error } = await stripe.redirectToCheckout({
      sessionId: response.sessionId,
    });

    if (error) {
      console.warn('Error:', error);
      setLoading(false);
    }
  };

  if (getSubtotalOfAllVariants({ cart }) === 0) {
    return (
      <section className="center">
        <p>Your cart is empty, fill it up!</p>
        <button className="pay-with-stripe">
          <Link style={{ color: 'white' }} to="/store">
            Back to Store
          </Link>
        </button>
      </section>
    );
  }

  return (
    <>
      <Table>
        <tbody>
          <TR>
            <TH>Product</TH>
            <TH>Price</TH>
            <TH>Quantity</TH>
            <TH>Total</TH>
            <TH></TH>
          </TR>
          {cart.map(item => {
            // for each cart item return null if subtotal 0,
            // variant rows if multiple prices, or a single row
            let subtotal = 0;
            item.prices.forEach(price => {
              if (price.quantity > 0) {
                subtotal += price.quantity;
              }
            });
            if (subtotal < 1) {
              return null;
            }
            // there are multiple price variants
            const productImg = item?.localFiles?.[0];
            if (item?.prices?.length > 1) {
              return (
                <React.Fragment key={item.id}>
                  <TR>
                    <TD>
                      {productImg && (
                        <ProductImg>
                          <GatsbyImage
                            image={getImage(productImg)}
                            alt={item.name}
                          />
                        </ProductImg>
                      )}
                      <ProductName>{item.name}</ProductName>
                    </TD>
                    <TD></TD>
                    <TD></TD>
                    <TD></TD>
                    <TD></TD>
                  </TR>
                  <VariantRows
                    removeFromCart={removeFromCart}
                    variants={item.prices}
                  />
                </React.Fragment>
              );
              // there is one price variant
            } else {
              return (
                <React.Fragment key={item.id}>
                  <TR key={item.id}>
                    <TD>
                      {productImg && (
                        <ProductImg>
                          <GatsbyImage
                            image={getImage(productImg)}
                            alt={item.name}
                          />
                        </ProductImg>
                      )}
                      <ProductName>{item.name}</ProductName>
                    </TD>
                    <TD>
                      <h4 className="price">
                        {formatPrice(item.prices[0]?.unit_amount)}
                      </h4>
                    </TD>
                    <TD>
                      <strong>{subtotal}</strong>
                    </TD>
                    <TD>
                      {formatPrice(subtotal * item.prices[0]?.unit_amount)}
                    </TD>
                    <TD
                      className="remove"
                      onClick={e => {
                        removeFromCart(item.id);
                      }}
                    >
                      Remove
                    </TD>
                  </TR>
                </React.Fragment>
              );
            }
          })}
        </tbody>
      </Table>

      <Payment>
        {/* first div is a grid column shim */}
        <div></div>
        <div className="total">
          <div className="caption">
            <p>
              <strong>Subtotal</strong>
            </p>
            <p>Shipping</p>
            <p className="emph">Total</p>
          </div>
          <div className="num">
            <p>
              <strong>{formatPrice(getSubtotalOfAllVariants({ cart }))}</strong>
            </p>
            <p>Free Shipping</p>
            <p className="emph">
              {formatPrice(getSubtotalOfAllVariants({ cart }))}
            </p>
          </div>
        </div>
        <div></div>

        <div className="checkout">
          {getSubtotalOfAllVariants({ cart }) > 0 && (
            <form
              onSubmit={handleSubmit}
              action="/.netlify/functions/create-checkout"
              method="post"
            >
              <div className="field">
                <label className="label" htmlFor={'email'}>
                  Email
                </label>
                <div className="control">
                  <input
                    className="input"
                    type={'email'}
                    name={'email'}
                    id={'email'}
                  />
                </div>
              </div>
              <div>
                <input
                  className="input"
                  type={'checkbox'}
                  name={'consent'}
                  id={'consent'}
                />
                <label className="label" htmlFor={'consent'}>
                  As a new customer, please give me an auto discount at checkout
                  and send me future promos via email
                </label>
              </div>
              <button
                disabled={loading}
                className="pay-with-stripe checkout"
                type="submit"
              >
                {!loading ? (
                  'Checkout'
                ) : (
                  <svg
                    width="4rem"
                    height="4rem"
                    style={{ marginTop: '-0.5rem' }}
                    version="1.1"
                    id="L9"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 100 100"
                    enable-background="new 0 0 0 0"
                    xmlSpace="preserve"
                  >
                    <path
                      fill="#000"
                      d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50"
                    >
                      <animateTransform
                        attributeName="transform"
                        attributeType="XML"
                        type="rotate"
                        dur="1s"
                        from="0 50 50"
                        to="360 50 50"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                )}
              </button>
            </form>
          )}
        </div>
      </Payment>
    </>
  );
};

export default CartDisplay;
