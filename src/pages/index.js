import React from 'react';
import { Link, graphql } from 'gatsby';
import Layout from '../components/layout';
import SEO from '../components/seo';
import Textlockup from '../components/textlockup';
import SalesBoxes from '../components/salesboxes';
import Shoe from '../images/shoe.jpg';
import Bag from '../images/bag.jpg';
import FeaturedProducts from '../components/featuredproducts';
import Bio from '../components/bio';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';
import styled from 'styled-components';

export const Tagline = styled.h2`
  text-align: center;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 1.7em;
  color: rgba(0, 0, 0, 0.8);
  padding: 20px;
  background: none;
  min-width: 80vw;
`;

export const Callout = styled.h4`
  font-weight: 400;
  padding-top: 20px;
  @media screen and (max-width: 1000px) {
    font-size: 1em;
  }
`;

const IndexPage = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`;
  const posts = data.posts.nodes;
  const home = data.home;

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="Home" />
      {/* <Bio /> */}

      <Tagline>{home?.frontmatter?.tagline}</Tagline>

      <br />
      <br />
      <br />
      <br />
      <section className="main-heading">
        <Callout>{home?.frontmatter?.homequote}</Callout>
      </section>
      <br />
      <br />
      <br />
      <br />
      <br />
      <div className="article-body">
        <div
          dangerouslySetInnerHTML={{
            __html: home?.html,
          }}
          itemProp="description"
        />

        <hr />
        <ol className="blogs-featured">
          {posts
            .filter(post => post?.frontmatter?.featuredpost)
            .map((post, idx) => {
              if (idx > 2) return null;
              const image = getImage(post?.frontmatter?.featuredimage);
              const title = post.frontmatter.title || post.fields.slug;

              return (
                <li key={post.fields.slug}>
                  <article
                    className="post-list-item"
                    itemScope
                    itemType="http://schema.org/Article"
                  >
                    <header>
                      <h2>
                        <Link to={post.fields.slug} itemProp="url">
                          <span itemProp="headline">{title}</span>
                        </Link>
                      </h2>
                    </header>
                    <section>
                      <p
                        dangerouslySetInnerHTML={{
                          __html: post.frontmatter.description || post.excerpt,
                        }}
                        itemProp="description"
                      />
                    </section>
                    {image && (
                      <Link to={post.fields.slug} itemProp="url">
                        <GatsbyImage
                          image={image}
                          alt={post.frontmatter.author}
                        />
                      </Link>
                    )}
                  </article>
                </li>
              );
            })}
        </ol>
      </div>
    </Layout>
  );
};

export default IndexPage;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    home: markdownRemark(frontmatter: { path: { eq: "/" } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        tagline
        homequote
        description
        featuredpost
        featuredimage {
          childImageSharp {
            gatsbyImageData(
              width: 1400
              placeholder: BLURRED
              formats: [AUTO, WEBP, AVIF]
            )
          }
        }
      }
    }
    posts: allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
    ) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          description
          featuredpost
          featuredimage {
            childImageSharp {
              gatsbyImageData(
                width: 600
                placeholder: BLURRED
                formats: [AUTO, WEBP, AVIF]
              )
            }
          }
        }
      }
    }
  }
`;
