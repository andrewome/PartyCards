import React, { Component } from 'react';
import './Games.css';
import Scoreboard from './scoreboard';
//import Player_list from './Player_list';
//import Deck from './Deck';
import Sort from './sorting'

class Taiti extends Component {
	constructor(props){
		super(props);
	}
	
	state = {
		whoseTurn: -1,
		turn_phase: 0, //0: select phase, 1: cheat phase
		server_PIN: this.props.serverPIN,
		last_action_tb: "Cheat!",
		message: "Starting game...",
		selected_cards: [],
		value: 1,
		num: 2,
		declared_cards: {num: -1, val: -1},
		Discard_pile: [],
		playerID: NaN,
		player_hand: [],
		player_index: NaN,
	}
	
	symToNum = (sym) => {
		switch(sym) {
			case '2':
				return 2;
			case '3':
				return 3; 
			case '4':
				return 4;
			case '5':
				return 5;
			case '6':
				return 6;
			case '7':
				return 7;
			case '8':
				return 8;
			case '9':
				return 9;
			case '10':
				return 10; 
			case 'J':
				return 11; 
			case 'Q':
				return 12;
			case 'K':
				return 13;
			case 'A':
				return 14;
		}
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

	handleSelect_Card = (card) => {
		this.setState({message: "You selected: " + card.name});
	}
	
	//This function handles the values submitted during phase 0 or user turn phase
	handleSubmit = (e) => {
		var firstTurn = false;
		var good = true;
		// checking of declared_cards is empty
		if(parseInt(this.state.declared_cards.num) == -1 && this.state.declared_cards.val == -1) {
			firstTurn = true;
		}
		
		//check if number of cards declared == number of cards selected
		if(parseInt(this.refs.num.value) != this.state.selected_cards.length) {
			alert('Number of cards declared not equal to number of cards selected!');
			good = false;
		}
		// check if cards declared is within +/- 1 of the previously declared card
		else if(!firstTurn) {
				var minusone = (this.symToNum(this.refs.val.value) - 2 - 1)%13;
				if(minusone < 0) {
					minusone +=15;
				}
			if(!(this.symToNum(this.refs.val.value) + 2 - 1)%13 == this.symToNum(this.state.declared_cards.val) || this.symToNum(this.refs.val.value) == this.symToNum(this.state.declared_cards.val) || minusone == this.symToNum(this.state.declared_cards.val)) {
				alert('The number of the cards you declared (' + this.symToNum(this.refs.val.value) + ') are not within +/- 1 of the previously declared card: ' + this.state.declared_cards.val);
				good = false;
			}
		}
		
		//if everything passes, we can submit the move to the server
		if(good) {
			this.props.socket.emit('cheatSubmitClientPhase0', {
				player_index: this.state.player_index,
				pinNo: this.state.server_PIN,
				declared_cards: {num: this.refs.num.value, val: this.refs.val.value},
				selected_cards: this.state.selected_cards,
			});
			//clear selected cards hand
			this.setState({selected_cards: []});
		}
		//console.log(this.refs.title.value);
		e.preventDefault();
	}
	
	//Function for callCheat
	handleCallCheat = () => {
		this.props.socket.emit('cheatSubmitClientPhase1', {
			player_index: this.state.player_index,
			pinNo: this.state.server_PIN,
			whoseTurn: this.state.whoseTurn,
			cheatVote: true,
		});
	}
	
	//Function for dontCallCheat
	handleDontCallCheat = () => {
		this.props.socket.emit('cheatSubmitClientPhase1', {
			player_index: this.state.player_index,
			pinNo: this.state.server_PIN,
			whoseTurn: this.state.whoseTurn,
			cheatVote: false,
		});
	}
	
	disableSelectButton = (phase, index, whoseTurn) => {
		if(phase == 0) {
			if(whoseTurn == index) {
				return false;
			}
			else {
				return true;
			}
		}
		else {
			if(whoseTurn == index) {
				return true;
			}
			else {
				return true;
			}
		}
	}
	
	disableCheatButton = (phase, index, whoseTurn) => {
		if(phase == 0) {
			if(whoseTurn == index) {
				return true;
			}
			else {
				return true;
			}
		}
		else {
			if(whoseTurn == index) {
				return true;
			}
			else {
				return false;
			}
		}
	}
	
	componentDidMount = () => {
		
		// When server emits the start game command
		this.props.socket.on('startGame', function(data) {
			alert('The last man has joined! Game is now starting');
			//finding player index
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id == this.props.socket.id) {
					break;
				}
			}
			this.setState ({
				turn_phase: 0,
				server_PIN: data.pinNo,
				whoseTurn: data.whoseTurn,
				player_hand: data.player.list[i].hand,
				player_index: i,
				playerID: data.player.list[i].ID
			});
		}.bind(this));
					
		//Phase 0 actions
		this.props.socket.on('cheatSubmitServerPhase0', function(data) {		
			//update the shared states (turn_phase, whoseTurn, discard_pile, declared_cards)
			let msg = "Player " + (this.state.whoseTurn + 1) + " plays " + data.declared_cards.num + " cards of " + data.declared_cards.val + "(s)";
			this.setState ({
				turn_phase: data.turn_phase,
				Discard_pile: data.Discard_pile,
				declared_cards: data.declared_cards,
				last_action_tb: msg,
			});
						
			//update private states
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id == this.props.socket.id) {
					break;
				}
			}
			if(i == data.player_index) {
				this.setState ({
					player_hand: data.player_hand,
				});
			}
		}.bind(this));
			
		//Phase 1 actions
		this.props.socket.on('cheatSubmitServerPhase1', function(data, msg) {
						
			//update shared states
			this.setState ({
				whoseTurn: data.whoseTurn,
				turn_phase: data.turn_phase,
				Discard_pile: data.Discard_pile,
				last_action_tb: msg,
			});
						
			//update private states
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id == this.props.socket.id) {
					break;
				}
			}
						
			if(i == data.player_index) {
				this.setState ({
					player_hand: data.player_hand,
				});
			}
		}.bind(this));
	}

	render() {
		var valoptions = ['2','3','4','5','6','7','8','10','J','Q','K','A']
		var numoptions = ['1','2','3','4']
		var playerhand = this.state.player_hand
		//Sorts hand according to value
		Sort.byValue(playerhand);
		var selectedcards = this.state.selected_cards
		const listHand = playerhand.map((d) =>
		<button disabled = {this.disableSelectButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn)}className = "Cards" onClick = {() => {
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
			selectedcards.splice(index, 1)
			this.setState({selected_cards: selectedcards})
			playerhand.push(d)
			this.setState({player_hand: playerhand})
		}}>X</a> </lu>);
		const listvaloptions = valoptions.map((index) =>
				<option value = {index}>{index}</option>
		)
		const listnumoptions = numoptions.map((index) => <option value = {index}>{index}</option>
)

		return (
			<div className = "Parent">
				<Scoreboard server_PIN = {this.state.server_PIN} GameName = "Cheat" 
				num_players = {this.props.num_players} whoseTurn = {this.state.whoseTurn}
				player_index = {this.state.player_index}/>
				<div className = "p1">
					{listHand}
					<div className = "p1">
						<form onSubmit = {this.handleSubmit.bind(this)}>
							<label className = "label">Choose the number of card(s): </label>
							<select disabled = {this.disableSelectButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn)} ref = "num" className = "dropdown">
								{listnumoptions}
							</select>
							<label className = "label"> Choose the value of card(s):</label>
								<select disabled = {this.disableSelectButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn)} ref = "val" className = "dropdown">
									{listvaloptions}
								</select>
							<input disabled = {this.disableSelectButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn)} type = "submit" value = "Play cards"/>
						</form>
					</div>
						<button disabled = {this.disableCheatButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn)} className = "button" onClick = {this.handleCallCheat}>Call Cheat!</button>
						<button disabled = {this.disableCheatButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn)} className = "button" onClick = {this.handleDontCallCheat}>Don't Call Cheat!</button>
					</div>
					<p className = "p1">{this.state.message}</p>
					{listCards}
					<h1 className = "discardpile">{this.state.last_action_tb}</h1>
			</div>
		);
	}
}

export default Taiti;
