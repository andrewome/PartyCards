import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './homepage.css';
import App from './App.js';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('body'));
registerServiceWorker();
