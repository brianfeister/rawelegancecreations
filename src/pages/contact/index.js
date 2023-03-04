import React, { useState } from 'react';
import { navigate } from 'gatsby-link';
import Layout from '../../components/layout';
import Bio from '../../components/bio';
import Seo from '../../components/seo';
import { encode } from '../../utils';
import jsonp from 'jsonp';

const Contact = ({ location }) => {
  const [formState, setFormState] = useState({ isValidated: false });

  const handleChange = e =>
    setFormState({ ...formState, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    const form = e.target;
    const body = encode({
      'form-name': form.getAttribute('name'),
      ...formState,
    });

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
      .then(res => navigate(form.getAttribute('action')))
      .catch(error => alert(error));
  };
  return (
    <Layout location={location}>
      <Seo title="Contact" />
      <Bio />
      <h1 className="main-heading">Contact</h1>

      <div className="article-body">
        <section className="section">
          <div className="container">
            <form
              name="contact"
              method="post"
              action="/contact/thanks/"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              onSubmit={handleSubmit}
            >
              {/* The `form-name` hidden field is required to support form submissions without JavaScript */}
              <input type="hidden" name="form-name" value="contact" />
              <div hidden>
                <label>
                  Don’t fill this out:{' '}
                  <input name="bot-field" onChange={handleChange} />
                </label>
              </div>
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
              <div className="field">
                <label className="label" htmlFor={'message'}>
                  Message
                </label>
                <div className="control">
                  <textarea
                    className="textarea"
                    name={'message'}
                    onChange={handleChange}
                    id={'message'}
                    required={true}
                  />
                </div>
              </div>
              <br />
              <div className="field">
                <button className="button is-link" type="submit">
                  Send
                </button>
              </div>
            </form>

            <br style={{ display: 'block', clear: 'both' }} />
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Contact;
