import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { StaticImage, getSrc, getImage } from 'gatsby-plugin-image';
import CalendlyButton from './calendlyButton';
import SkeletonProfile from './skeletonProfile';
import Modal from 'react-modal';
import { encode } from '../utils';
import { navigate } from 'gatsby-link';
import jsonp from 'jsonp';

const customModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: 360,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 9999,
  },
};

Modal.setAppElement('#___gatsby');

export const StyledFooter = styled.footer`
  background: white;
  font-size: 0.8em;
  .article-body {
    background: white;
  }
  .footer-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-column-gap: 2vw;
    img {
      width: 100%;
      max-width: 300px;
    }
    @media screen and (max-width: 600px) {
      grid-template-columns: repeat(1, 1fr);
      grid-column-gap: 0;
      h5 {
        margin-top: 30px;
      }
      img {
        max-width: 100%;
      }
    }
  }
  .footer-icon-link {
    border-bottom: none;
    display: flex;
    align-items: flex-end;
    float: left;
    margin-right: 10px;
    clear: both;
    vertical-align: middle;
    margin-bottom: 10px;
    font-weight: bold;
    img {
      float: left;
      display: inline-block;
      width: 32px;
      padding: 0 7px 0 0;
    }
  }
`;

const StyledSignupBox = styled.div`
  .modal-wrap-inner {
    padding: 20px;
    width: 360px;
  }
  .modal-intro-text {
    font-size: 1.05rem;
    text-align: center;
  }
  .modal-btn:checked ~ .modal .modal-wrap {
    opacity: 1;
    transform: scale(1);
    transition: opacity 250ms 500ms ease, transform 350ms 500ms ease;
  }

  .inline-signup {
    display: flex;
    justify-content: left;
  }

  @media screen and (max-width: 600px) {
    .inline-signup {
      justify-content: center;
    }
  }

  iframe {
    border: 1px solid #eee;
    background: white;
  }
`;

/**
 * Build a query string of MC list fields
 *
 * @param {Object} fields - a list of mailchimp audience field labels
 *  and their values. We uppercase because that's what MC requires.
 *  NOTE: GROUPS stay as lowercase (ex: MC uses group field names as `group[21269]`)
 *
 * @return {String} - `&FIELD1=value1&FIELD2=value2&group[21265][2]=group1`
 */
const convertListFields = fields => {
  let queryParams = '';
  for (const field in fields) {
    if (Object.prototype.hasOwnProperty.call(fields, field)) {
      // If this is a list group, not user field then keep lowercase, as per MC reqs
      // https://github.com/benjaminhoffman/gatsby-plugin-mailchimp/blob/master/README.md#groups
      const fieldTransformed =
        field.substring(0, 6) === 'group[' ? field : field.toUpperCase();
      queryParams = queryParams.concat(`&${fieldTransformed}=${fields[field]}`);
    }
  }
  return queryParams;
};

const subscribeToMailchimp = async (email, fields) => {
  const queryParams = `&EMAIL=${encodeURIComponent(email)}${convertListFields(
    fields
  )}`;
  const url = `https://app.us11.list-manage.com/subscribe/post-json?u=5723136ae72f80537ccc2fe4d&amp;id=903c1b9f75&amp;f_id=00c99ce0f0${queryParams}`;

  return new Promise((resolve, reject) =>
    jsonp(url, { timeout: 3500 }, (err, data) => {
      if (err) reject(err);
      if (data) resolve(data);
    })
  );
};

export const MailChimpSignup = () => {
  const [formState, setFormState] = useState({ isValidated: false });
  const [formError, setFormError] = useState({});
  const [formSuccess, setFormSuccess] = useState({});
  const handleChange = e =>
    setFormState({ ...formState, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const res = await subscribeToMailchimp(formState?.email, {
        fname: formState?.name,
      });
      setFormSuccess(`Check your inbox for details`);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="inline-signup">
      <form method="post" onSubmit={handleSubmit}>
        <div className="field">
          <label className="label" htmlFor={'name'}>
            Your name
          </label>
          <div className="control">
            <input
              className="input"
              type={'text'}
              name={'name'}
              onChange={handleChange}
              id={'name'}
              required={true}
            />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor={'email'}>
            Email
          </label>
          <div className="control">
            <input
              className="input"
              type={'email'}
              name={'email'}
              onChange={handleChange}
              id={'email'}
              required={true}
            />
          </div>
        </div>
        <br />
        <br />
        <div className="field">
          <button className="button is-link" type="submit">
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
};

export const SignupBox = () => {
  const [modalIsOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const cookieKey = 'rawEleganceMarketingModalViewed';
    if (document?.cookie?.match(cookieKey + '=true')) {
      return;
    }
    var expires = new Date();
    expires.setSeconds(expires.getSeconds() + 10368000);
    const cookieToSet = `${cookieKey}=true;expires=${expires.toUTCString()};`;
    document.cookie = cookieToSet;
    setTimeout(() => {
      setIsOpen(true);
    }, 5000);
  }, []);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <StyledSignupBox>
      <MailChimpSignup />

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customModalStyles}
        contentLabel="Newsletter Signup"
      >
        <h2>Welcome!</h2>

        <div class="modal-wrap-inner">
          <p class="modal-intro-text">
            If you'd like to <strong>receive 10% off</strong> your first order,
            and hear about our newest lovingly hand-crafted organic wearable
            expressions, we will email you a promo code.{' '}
          </p>
          <MailChimpSignup />
          <a
            target="_blank"
            href=""
            class="close-modal"
            onClick={e => {
              e.preventDefault();
              closeModal();
            }}
          >
            Close
          </a>
        </div>
      </Modal>
    </StyledSignupBox>
  );
};

const Footer = ({
  siteTitle,
  footerImage,
  footerBioText,
  footerMeetText,
  footerCredits,
  socialLinks,
}) => {
  return (
    <StyledFooter>
      <div className="article-body">
        <div className="footer-grid">
          <div>
            <h5>About Danielle</h5>
            <p>{footerBioText}</p>
            <img src={getSrc(footerImage)} />

            <SignupBox />
          </div>
          <div className="footer-grid">
            <div>
              <h5>Connect</h5>
              {socialLinks.map((link, idx) => {
                let icon;
                if (link.url.match(/twitter/gi)) {
                  icon = 'twitter';
                } else if (link.url.match(/instagram/gi)) {
                  icon = 'instagram';
                } else if (link.url.match(/facebook/gi)) {
                  icon = 'facebook';
                } else if (link.url.match(/youtube/gi)) {
                  icon = 'youtube';
                } else {
                  icon = 'earth';
                }
                return (
                  <a key={idx} className="footer-icon-link" href={link.url}>
                    <img alt={link.title} src={`/images/${icon}.svg`} />
                    {link.title}
                  </a>
                );
              })}
            </div>
            <div>
              <h5>Meet Danielle</h5>
              {footerMeetText}
              <CalendlyButton>Schedule Now</CalendlyButton>
              <br />
              <br />
              <br />© {new Date().getFullYear()} {siteTitle}
              {` | `}
              Built with <a href="https://www.gatsbyjs.com">Gatsby</a>
              {footerCredits.map((item, idx) => (
                <React.Fragment key={idx}>
                  {` | `}
                  {item.text} <a href={item.url}>{item.linktext}</a>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StyledFooter>
  );
};

export default Footer;
