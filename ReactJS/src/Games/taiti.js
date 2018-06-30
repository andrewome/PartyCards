import React, { Component } from 'react';
import './Games.css';
import Scoreboard from './scoreboard';
import Player_list from './Player_list';
import Deck from './Deck.js';

class Taiti extends Component{
  constructor(props){
    super(props);
    super(Player_list)
  }
  state = {
    Discard_pile: [],
    playerID: 0
  }
  render(){
    //Initialisation
    var players = new Player_list(this.props.num_players);
    var deck = new Deck();
    deck.generate_deck();
    deck.shuffle();
    //Dealing out the cards
    while(deck.size() != 0){
      let card = deck.deal();
      players.list[(deck.size()+1)%this.props.num_players].hand.push(card)
    }
    const playerhand = players.list[this.state.playerID].hand;
    //Sorts hand according to value
    for(let i = 0;i<playerhand.length;i++){
      var changed = 0;
      for(let j = 0;j<playerhand.length -1;j++){
        if(playerhand[j].value.num > playerhand[j+1].value.num){
          var changed = 1
          var temp = playerhand[j]
          playerhand[j] = playerhand[j+1]
          playerhand[j+1] = temp;
        }
        else{
          continue;
        }
      }
      if(changed == 0){
          break;
      }
    }
    const listHand = playerhand.map((d) => <li key={d.name}>{d.name} </li>);
    return(
      <div>
      <Scoreboard GameName = "Taiti" num_players = {this.props.num_players}
      players = {players}
      />
      <p>{players.list[0].name}</p>
      {listHand}
      </div>
    );
  }
}

export default Taiti;
