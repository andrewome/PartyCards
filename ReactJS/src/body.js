import React, { Component } from 'react';
import './homepage.css';
import Svrcreate from './svrcreate';

class Body extends Component {
  state = {
    server_PIN: "Enter PIN here",
    create_server: false,
    join_server: false
  }
  handle_create_server = () =>  {
    this.setState({create_server: true});
  }
  handle_join_server = () => {
    this.setState({join_server: true});
  }

  render() {
    if(this.state.create_server === false && this.state.join_server === false){
    return (
      <div className="Init">
        <button type = "primary" className = "button" onClick = {this.handle_create_server}> Create New Server </button>
        <br/>
        <p className = "para"> or </p>
        <input type = "text" className = "textfield" value = {this.state.server_PIN} onChange={(e) => {this.setState({server_PIN: e.target.value})}}></input>
        <br/>
        <button className = "button" onClick = {this.handle_join_server}>Join Existing Server</button>
      </div>
    );
  }
  else if(this.state.create_server){
    return(
      <Svrcreate/>
    )
  }

  else if(this.state.join_server){
    return(
      <div className="Init">
      <p>Enter the server PIN:</p>
      <input type = "text"/>
      </div>
    );
  }
}
}
export default Body;
