import React, { Component } from 'react';
import './homepage.css'

class Svrcreate extends Component{
  state = {
    selectGame : "Taiti",
    num_players : "4"
  };
  handleChange = (event) => {
    this.setState({selectGame: event.target.value});
  };
  handleNumChange = (event) =>{
    this.setState({num_players: event.target.value});
  }
  render(){
    return(
    <div className="Init">
    <p>Your server PIN is 1729 </p>

    <p>Choose the game you want to play:</p>

    <select
        value={this.state.selectGame}
        onChange={this.handleChange}
      >
       <option value="Taiti">Taiti</option>
        <option value="Cheat">Cheat</option>
        <option value="Hearts">Hearts</option>
        <option value="Bridge">Bridge</option>
      </select>
      <p>Select the number of players</p>
        <select value={this.state.num_players}
        onChange={this.handleNumChange}>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
        <br/>
        <button className = "button">Submit </button>
      </div>
    );
  }
}
  /*  <select id = "dropdown">
                <option value="Big 2">Taiti</option>
                <option value="Cheat">Cheat</option>
                <option value="Hearts">Hearts</option>
                <option value="Bridge">Bridge</option>
            </select>
    <p>Select the number of players</p>
      <select id = "dropdown">
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
      <br/>
      <button className = "textfield">Submit </button>
    </div>
    {*/

export default Svrcreate;
