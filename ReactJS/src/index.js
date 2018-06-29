import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Title from './title';
import Body from './body';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Title />, document.getElementById('title'));
ReactDOM.render(<Body />, document.getElementById('body'));
registerServiceWorker();
