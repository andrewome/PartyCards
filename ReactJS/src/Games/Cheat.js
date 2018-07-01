import React, { Component } from 'react';
import './Games.css';
import Scoreboard from './scoreboard';
import Player_list from './Player_list';
//import Deck from './Deck';
import Sort from './sorting'

class Taiti extends Component {
	constructor(props){
		super(props);
	}
	state = {
		instance: {},
		server_PIN: this.props.serverPIN,
		top_deck: "Cheat!",
		message: "Select a card!",
		selected_cards: [],
		Discard_pile: [],
		playerID: "",
		player_hand: [],
		player_index: 0
	}

	componentDidMount = () => {
		this.props.socket.on('startGame', function(data) {
			alert('The last man has joined! Game is now starting');
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id == this.props.socket.id) {
					break;
				}
			}
			if(data.player.list[i].id == this.props.socket.id) {
				console.log('IDs match');
			}

			this.setState({instance	  : data,
						   player_hand: data.player.list[i].hand,
							 player_index: i,
						   playerID   : data.player.list[i].ID});

		}.bind(this));
	}
	handleSelect_Card = (name) => {
		this.setState({message: "You selected: " + name});
	}

	render() {
		var playerhand = this.state.player_hand
    //Sorts hand according to value
    //Sort.byValue(playerhand);
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
      </li>);
    return(
      <div className = "Parent">
				<p> {this.state.instance.pinNo} </p>
				<Scoreboard server_PIN = {this.state.server_PIN}   GameName = "Cheat" num_players = {this.props.num_players}
				/>
				<div className = "p1">
					{listHand}
					<button className = "button">Call Bluff!</button>
				</div>
				<p className = "p1">{this.state.message}</p>
				{listCards}
				<h1 className = "discardpile">{this.state.top_deck}</h1>
      </div>
    );
  }
}

export default Taiti;
