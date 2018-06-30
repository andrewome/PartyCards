import React, { Component } from 'react';
import './Games.css';

class Scoreboard extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const data = this.props.players.list
    const listItems = data.map((d) => <li key={d.name}>{d.name} Score: {d.score}</li>);
    return(
      <div className = "Scoreboard">
        <p>Room PIN: {this.props.server_PIN}</p>
        <p>Game being played: {this.props.GameName}</p>
        {listItems}
      </div>
    );
  }
}

export default Scoreboard;
