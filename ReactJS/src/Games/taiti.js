import React, { Component } from 'react';
import './Games.css';
import Scoreboard from './scoreboard';
import Player_list from './Player_list';
//import Deck from './Deck';
import Sort from './sorting'

class Taiti extends Component{
  constructor(props){
    super(props);
    super(Player_list)
  }
  state = {
    server_PIN: "1729",
    top_deck: "Cheat!",
    message: "Select a card!",
    selected_cards: [],
    Discard_pile: [],
    playerID: 0
  }
  handleSelect_Card = (name) =>{
    this.setState({message: "You selected: " + name});
  }
  render(){
    //Initialisation
    var players = new Player_list(this.props.num_players);
    /*var deck = new Deck();
    deck.generate_deck();
    deck.shuffle();
    //Dealing out the cards
    while(deck.size() != 0){
      let card = deck.deal();
      players.list[(deck.size()+1)%this.props.num_players].hand.push(card)
    }
    const playerhand = players.list[this.state.playerID].hand;
    //Sorts hand according to value
    Sort.byValue(players.list[0].hand);
    var selected_cards = []
    const listHand = playerhand.map((d) =>
      <button className = "Cards" onClick = {() => {
        this.handleSelect_Card(d.name)
        selected_cards.push(d.name)
      }}
      key={d.name}>{d.name}
      </button>);
    const listCards = selected_cards.map((card) =>
      <li key = {card.name}>{card.name}
      </li>);*/
    return(
      <div className = "Parent">
        <Scoreboard server_PIN = {this.state.server_PIN}   GameName = "Cheat" num_players = {this.props.num_players}
        players = {players}
        />
        <div className = "p1">
          <p>{players.list[0].name}</p>
          {/*}{listHand}{*/}
          <button className = "button">Call Bluff!</button>
        </div>
        <p className = "p1">{this.state.message}</p>
          {/*}{listCards}{*/}
        <h1 className = "discardpile">{this.state.top_deck}</h1>
      </div>
    );
  }
}

export default Taiti;
