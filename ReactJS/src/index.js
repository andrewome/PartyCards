import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './homepage.css';
import Title from './title.js';
import Body from './body.js';
import registerServiceWorker from './registerServiceWorker';


ReactDOM.render(<Title />, document.getElementById('title'));
ReactDOM.render(<Body />, document.getElementById('body'));
registerServiceWorker();
