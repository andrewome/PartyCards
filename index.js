import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './homepage.css';
import registerServiceWorker from './registerServiceWorker';

class App extends Component {
  render() {
    return (
      <div className="App">
      <h1>Welcome to PartyCards!</h1>
      </div>
    );
  }
}
class Body extends Component {
  constructor() {
    super();
    this._handleClick = this._handleClick.bind(this);
  }
  state = {
    server_PIN: "Enter PIN here"
  }
  _handleClick() {
    let mountNode = React.findDOMNode(this.refs.Init);
    let unmount = React.unmountComponentAtNode(mountNode);
    // console.log(unmount); // false
  }

  render() {
    return (
      <div className="Init">
        <button type = "primary" className = "server" onClick = {this._handleClick}> Create New Server </button>
        <br/>
        <p className = "para"> or </p>
        <input type = "text" className = "textfield" value = {this.state.server_PIN} onChange={(e) => {this.setState({server_PIN: e.target.value})}}></input>
        <br/>
        <button className = "server">Join Existing Server</button>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('title'));
ReactDOM.render(<Body />, document.getElementById('body'));
registerServiceWorker();
