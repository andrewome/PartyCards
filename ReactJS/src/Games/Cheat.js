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
		turn_phase: 0, // 0 for not your turn, 1 for your turn pick phase, 2 for your turn Cheat phase
		instance: {},
		server_PIN: this.props.serverPIN,
		last_action_tb: "Cheat!",
		message: "Starting game...",
		selected_cards: [],
		value: 1,
		num: 2,
		declared_cards: [],
		Discard_pile: [],
		playerID: "",
		player_hand: [],
		player_index: 0
	}
	numtoEng = (num) => {
		switch(num){
			case '1':
			return 'one';
			case '2':
			return 'two';
			case '3':
			return 'three';
			case '4':
			return 'four';
		}
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
	//This function handles the values submitted during phase 1 or user turn phase
	handleSubmit(e){
    if(parseInt(this.refs.num.value) != this.state.selected_cards.length){
      alert('Number of cards declared not equal to number of cards selected!');
    }
    else{
      this.setState({declared_cards: [parseInt(this.refs.num.value),parseInt(this.refs.val.value)]});
			const msg = "Player " + (this.state.player_index + 1) + " plays " + this.numtoEng(this.refs.num.value) + " " + this.refs.val.value + "s";
			this.setState({last_action_tb: msg} )
      }
    //console.log(this.refs.title.value);
     e.preventDefault();
  }

	render() {
		var valoptions = ['2','3','4','5','6','7','8','10','J','Q','K','A']
		var numoptions = ['1','2','3','4']
		var playerhand = this.state.player_hand
    //Sorts hand according to value
    Sort.byValue(playerhand);
    var selectedcards = this.state.selected_cards
    const listHand = playerhand.map((d) =>
      <button disabled = {this.state.turn_phase != 1}className = "Cards" onClick = {() => {
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
		<lu
		key={d.name}>{d.name} <a href='#' onClick = {() =>{
			let index = selectedcards.findIndex(x => x.name === d.name)
			selectedcards.splice(index,1)
			this.setState({selected_cards: selectedcards})
			playerhand.push(d	)
			this.setState({player_hand: playerhand})
		}}>X</a> </lu>);
	const listvaloptions = valoptions.map((index) =>
				<option value = {index}>{index}</option>
	)
	const listnumoptions = numoptions.map((index) =>
			<option value = {index}>{index}</option>
)

    return(
      <div className = "Parent">
				<p> {this.state.instance.pinNo} </p>
				<Scoreboard server_PIN = {this.state.server_PIN}   GameName = "Cheat" num_players = {this.props.num_players}
				/>
				<div className = "p1">
					{listHand}
						<div className = "p1">
							<form onSubmit = {this.handleSubmit.bind(this)}>
								<label className = "label">Choose the number of card(s): </label>
								<select disabled = {this.state.turn_phase != 1} ref = "num" className = "dropdown">
									{listnumoptions}
									</select>
									<label className = "label"> Choose the value of card(s):</label>
									<select disabled = {this.state.turn_phase != 1} ref = "val" className = "dropdown">
									{listvaloptions}
								</select>
								<input disabled = {this.state.turn_phase != 1}type = "submit" value = "Play cards"/>
							</form>
						</div>
					<button disabled = {this.state.turn_phase != 2} className = "button" onClick = {this.handCheat

					}>Call Cheat!</button>
				</div>
				<p className = "p1">{this.state.message}</p>
					{listCards}
				<h1 className = "discardpile">{this.state.last_action_tb}</h1>
      </div>
    );
  }
}

export default Taiti;
