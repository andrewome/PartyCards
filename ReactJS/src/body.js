import React, { Component } from 'react';
import './body.css'

class Body extends Component {
  state = {
    New_server_name: "Enter Server Name",
    New_server_PIN: "Enter Server PIN",
    server_name: "Enter Server Name",
    server_PIN: "Enter Server Name"
  }
  /*txt1ChangedHandler = (event) =>{
    this.setState({text: [event.target.value,"Enter Server PIN","Enter Server name","Enter Server PIN"]});
  }
  txt2ChangedHandler = (event) =>{
    this.setState({text: ["Enter Server name",event.target.value,"Enter Server name","Enter Server PIN"]});
  }*/
  render() {
    return (
      <div className="Init">
      <input type = "text" className = "textfield" value = {this.state.New_server_name} onChange={(e) => {this.setState({New_server_name: e.target.value})}} ></input>
      <br/>
      <input type = "text" className = "textfield" value = {this.state.New_server_PIN} onChange={(e) => {this.setState({New_server_PIN: e.target.value})}}></input>
      <br/>
      <button className = "server" onClick = {() =>  this.render(<input type = "text"></input>)}> Create New Server </button>
      <br/>
      <input type = "text" className = "textfield" value = {this.state.server_name} onChange={(e) => {this.setState({server_name: e.target.value})}}></input>
      <br/>
      <input type = "text" className = "textfield" value = {this.state.server_PIN} onChange={(e) => {this.setState({server_PIN: e.target.value})}}></input>
      <br/>
      <button className = "server">Join Existing Server</button>
      </div>
    );
  }
}

export default Body;
