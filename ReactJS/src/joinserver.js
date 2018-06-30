import React,{Component} from 'react'
import './homepage.css'

class JoinServer extends Component{
  render(){
    return(
      <div className>
      <p>Enter the server PIN:</p>
      <input type = "text"/>
      <button className = "button"> Submit </button>
      </div>
    );
  }
}

export default JoinServer;
