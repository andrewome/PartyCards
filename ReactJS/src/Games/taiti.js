import React, { Component } from 'react';
import './Games.css';
import Scoreboard from './scoreboard';
import Player_list from './Player_list';

class Taiti extends Component{
  constructor(props){
    super(props);
  }
  state = {
    list: new Player_list(this.props.num_players)
  }
  render(){
    return(
      <div>
      <Scoreboard GameName = "Taiti" num_players = {this.props.num_players}/>
      </div>
    );
  }
}

export default Taiti;
