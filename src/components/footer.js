import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { StaticImage, getSrc, getImage } from 'gatsby-plugin-image';
import CalendlyButton from './calendlyButton';
import SkeletonProfile from './skeletonProfile';
import Modal from 'react-modal';

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

export const SignupFormWithFallback = () => {
  const [iframeLoading, toggleIframeLoaded] = useState('LOADING');
  const onIframeLoaded = () => {
    toggleIframeLoaded('LOADED');
  };

  return (
    <>
      {iframeLoading === 'LOADING' && <SkeletonProfile />}
      {/*
      iframe onLoaded callback was setting FAILED erroneously, ignore for now
      {iframeLoading === 'FAILED' && (
        <a
          class="primary fit"
          target="_blank"
          href="https://ninagroop.substack.com/subscribe?utm_source=ninagroop.com&simple=true&next=https%3A%2F%2Fninagroop.substack.com%2Farchive"
        >
          Sign Up
        </a>
      )} */}
      {iframeLoading !== 'LOADING' && (
        <iframe
          src="https://ninagroop.substack.com/embed"
          width="320"
          height="290"
          frameBorder="0"
          scrolling="no"
        />
      )}
      <iframe
        id="iframe-ref"
        style={{ display: 'none' }}
        src="https://ninagroop.substack.com/embed"
        width="320"
        height="290"
        frameBorder="0"
        scrolling="no"
        onLoad={onIframeLoaded}
      />
    </>
  );
};

export const SignupBox = () => {
  const [modalIsOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const cookieKey = 'ninaGroopMarketingModalViewed';
    if (document?.cookie?.match(cookieKey + '=true')) {
      return;
    }
    var expires = new Date();
    expires.setSeconds(expires.getSeconds() + 10368000);
    const cookieToSet = `${cookieKey}=true;expires=${expires.toUTCString()};`;
    document.cookie = cookieToSet;
    setIsOpen(true);
  }, []);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <StyledSignupBox>
      <div class="inline-signup">
        <SignupFormWithFallback />
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customModalStyles}
        contentLabel="Newsletter Signup"
      >
        <h2>Welcome!</h2>

        <div class="modal-wrap-inner">
          <p class="modal-intro-text">
            If you'd like to hear from me in your inbox or you'd like to receive
            insight into your character strengths, sign up below. I'd love to
            send you my newsletter and some free resources that will empower
            you.{' '}
            <a
              class="primary fit"
              target="_blank"
              href="https://ninagroop.substack.com/subscribe?utm_source=ninagroop.com&simple=true&next=https%3A%2F%2Fninagroop.substack.com%2Farchive"
            >
              Sign Up
            </a>
          </p>
          <SignupFormWithFallback />
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
