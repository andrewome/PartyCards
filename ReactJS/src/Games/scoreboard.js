import React, { Component } from 'react';
import './Games.css';

class Scoreboard extends Component{
  render(){
    return(
      <div className = "Scoreboard">
      <p>Game being played: {this.props.GameName}</p>
      <p>Number of players: {this.props.num_players} </p>
      </div>
    );
  }
}

export default Scoreboard;
