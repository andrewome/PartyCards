import React from 'react';
import{
  Router,
  Route,
  Switch,
}from 'react-router-dom';

import Auth from './Auth';
import Login from './Login';
import Register from './Register';

export default () => (
  <Router>
  <Switch>{/*Switch means that one of below routes will be rendered at a time*/}
  <Route exact path="/Auth" render ={props => <Auth{...props}/>}/>
  <Route exact path="/register" render ={props => <Register {...props}/>}/>
  <Route exact path="/login" render ={props => <Login{...props}/>}/>
  </Switch>
  </Router>
);
