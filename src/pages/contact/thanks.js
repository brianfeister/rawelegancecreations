import React, { useState } from 'react';
import { navigate } from 'gatsby-link';
import Layout from '../../components/layout';
import Bio from '../../components/bio';
import Seo from '../../components/seo';

const Thanks = ({ location }) => {
  return (
    <Layout location={location}>
      <Seo title="Contact - Thanks" />
      <Bio />
      <h1 className="main-heading">Thanks!</h1>

      <div className="article-body">
        <br />
        <br />
        <br />
        <br />
        Thanks for connecting, I'll get back to you as soon as I can!
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
      </div>
    </Layout>
  );
};

export default Thanks;
