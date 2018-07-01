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
		message: "Starting game...",
		selected_cards: [],
		declared_cards: [],
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
	handleSelect_Card = (card) => {
		this.setState({message: "You selected: " + card.name});
	}
	handleSubmit(e){
    if(this.refs.num.value === ''){
      alert('Number of cards not entered!');
    }
		if(this.refs.val.value === ''){
			alert('Value of cards not entered!');
		}
    else{
      this.setState({declared_cards: [parseInt(this.refs.num.value),parseInt(this.refs.val.value)]}
			);
      }
    //console.log(this.refs.title.value);
     e.preventDefault();
  }
	handleCheat = () =>{

	}

	render() {
		var playerhand = this.state.player_hand
    //Sorts hand according to value
    Sort.byValue(playerhand);
    var selectedcards = this.state.selected_cards
    const listHand = playerhand.map((d) =>
      <button className = "Cards" onClick = {() => {
				let index = playerhand.findIndex(x => x.name === d.name)
				playerhand.splice(index,1)
				this.setState({player_hand: playerhand})
				selectedcards.push(d)
        this.handleSelect_Card(d)
				this.setState({selected_cards: selectedcards})
      }}
      key={d.name}>{d.name}
      </button>);
    const listCards = this.state.selected_cards.map((d) =>
		<lu className = "Cards"
		key={d.name}>{d.name} <a href='#' onClick = {() =>{
			let index = selectedcards.findIndex(x => x.name === d.name)
			selectedcards.splice(index,1)
			this.setState({selected_cards: selectedcards})
			playerhand.push(d	)
			this.setState({player_hand: playerhand})

		}}>X</a> </lu>);

    return(
      <div className = "Parent">
				<p> {this.state.instance.pinNo} </p>
				<Scoreboard server_PIN = {this.state.server_PIN}   GameName = "Cheat" num_players = {this.props.num_players}
				/>
				<div className = "p1">
					{listHand}
					<form onSubmit = {this.handleSubmit.bind(this)}>
						<label>Enter number of card(s): </label>
						<input type = "text" className = "field" ref = "num"/>
						<label> Enter value of card(s): </label>
						<input type="text" className = "field" ref = "val"/>
						<input type = "submit" value = "Play Cards!" className = "button"/>
					</form>
					<button className = "button" onClick = {this.handCheat

					}>Call Cheat!</button>
				</div>
				<p className = "p1">{this.state.message}</p>
					{listCards}
				<h1 className = "discardpile">{this.state.top_deck}</h1>
      </div>
    );
  }
}

export default Taiti;
