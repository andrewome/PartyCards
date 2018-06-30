import React, { Component } from 'react';
import './homepage.css'

class Svrcreate extends Component{
  state = {
    server_PIN: "1729",
    selectGame : "Taiti",
    num_players : "4",
    server_created : false
  };
  handleChange = (event) => {
    this.setState({selectGame: event.target.value});
  };
  handleNumChange = (event) =>{
    this.setState({num_players: event.target.value});
  };
  handleSubmission = () =>{
    var Game = this.state.selectGame;
    var num_players = this.state.num_players;
    this.props.OnHandle_server_created(true);
    this.props.OnHandle_selectGame(Game);
    this.props.OnHandle_num_players(num_players);
  }
  render(){
    return(
    <div className="Init">
    <p>Your server PIN is {this.state.server_PIN}</p>

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
        <button className = "button" onClick = {this.handleSubmission}>Submit </button>
      </div>
    );
  }
}

export default Svrcreate;
