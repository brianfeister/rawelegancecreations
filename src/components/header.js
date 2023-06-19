import React, { useState, useEffect, useContext } from 'react';
import { Link, useStaticQuery } from 'gatsby';
import PropTypes from 'prop-types';
import { Head, Nav, CartTotal } from './header-styles';
import { CartContext } from '../context/cart';
import { makeStyles } from '@material-ui/core/styles';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuIcon from '@material-ui/icons/Menu';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import useScrollTrigger from '@material-ui/core/useScrollTrigger';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Slide from '@material-ui/core/Slide';

const useStyles = makeStyles({
  list: {
    width: 250,
  },
  fullList: {
    width: 'auto',
  },
  paper: {},
  icon: {},
  appBar: {
    background: '#fff',
    color: '#000',
    boxShadow: 'none',
  },
  toolbar: {
    justifyContent: 'space-between',
  },
});

const SwipeableTemporaryDrawer = ({
  siteTitle,
  nav,
  getTotalCount,
  showToggle,
}) => {
  const classes = useStyles();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleDrawer = override => event => {
    if (
      event &&
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }

    setSidebarOpen(!sidebarOpen);
  };

  const list = anchor => (
    <div
      role="presentation"
      onClick={toggleDrawer()}
      onKeyDown={toggleDrawer()}
      className={classes.list}
    >
      <List>
        {nav.map(item => (
          <Link key={item.slug} to={item.slug}>
            <ListItem button key={item.title}>
              <ListItemText>
                {item.showcartindicator && getTotalCount() > 0 ? (
                  <CartTotal>{getTotalCount()}</CartTotal>
                ) : null}
                {item.title}
              </ListItemText>
            </ListItem>
          </Link>
        ))}
      </List>
    </div>
  );

  return (
    <div>
      {showToggle && (
        <Button className="hidden-desktop" onClick={toggleDrawer()}>
          <MenuIcon />
        </Button>
      )}

      <SwipeableDrawer
        classes={{ paper: classes.paper }}
        anchor={'right'}
        open={sidebarOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
      >
        {list('right')}
      </SwipeableDrawer>
    </div>
  );
};

const HideOnScroll = props => {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
};

const HideAppBar = ({ siteTitle, nav, getTotalCount, location, ...rest }) => {
  const classes = useStyles();
  return (
    <>
      <HideOnScroll {...rest}>
        <AppBar className={classes.appBar}>
          <Toolbar className={classes.toolbar}>
            <a href="/" className="brand navbar-heading">
              {/* {siteTitle} */}
              <img src={'/images/brand-logo.svg'} alt="Raw Elegance Logo" />
            </a>
            <div className="hidden-desktop">
              <Nav>
                <ul className="nav-menu">
                  {nav.map(item => (
                    <li key={item.slug}>
                      {item.showcartindicator && getTotalCount() > 0 ? (
                        <CartTotal>{getTotalCount()}</CartTotal>
                      ) : null}
                      <Link to={item.slug}>{item.title}</Link>
                    </li>
                  ))}
                </ul>
              </Nav>
            </div>
            <div className="hidden-mobile">
              <SwipeableTemporaryDrawer
                siteTitle={siteTitle}
                nav={nav}
                getTotalCount={getTotalCount}
                location={location}
                showToggle={true}
              />
            </div>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Toolbar />
    </>
  );
};

const Header = ({ siteTitle, siteDescription, description, nav, location }) => {
  const [cart, updateCart, getTotalCount] = useContext(CartContext); // eslint-disable-line no-unused-vars
  const [cartCount, updateCartCount] = useState(0); // eslint-disable-line no-unused-vars

  useEffect(() => {
    updateCartCount(cart.reduce((acc, next) => acc + next.quantity, 0));
  }, [cart]);

  return (
    <>
      <HideAppBar
        siteTitle={siteTitle}
        nav={nav}
        getTotalCount={getTotalCount}
        location={location}
      />
      <Head className="article-body no-bg">
        {/* TODO: make show only for home page */}
        <div className="brand-wrap">
          <h1 className="brand brand-title">{siteTitle}</h1>
          <h2 className="brand brand-subtitle">{siteDescription}</h2>
        </div>
      </Head>
    </>
  );
};

export default Header;
