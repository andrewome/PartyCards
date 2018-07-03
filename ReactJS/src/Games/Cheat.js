import React, { Component } from 'react';
import './Games.css';
import Scoreboard from './scoreboard';
import Sort from './sorting'

class Cheat extends Component {
	constructor(props){
		super(props);
		// When server emits the start game command
		this.props.socket.on('startGame', function(data) {
			var msg = ('The last man has joined! Game is now starting. Player ' + (data.whoseTurn + 1) + ' will start first.');
			this.setState({message: msg});
			//finding player index
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id == this.props.socket.id) {
					break;
				}
			}
			this.setState ({
				turn_phase: 0,
				server_PIN: data.pinNo,
				whoseTurn: parseInt(data.whoseTurn),
				player_hand: data.player.list[i].hand,
				player_index: parseInt(i),
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

			//update private states, get client's index by linear searching
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id == this.props.socket.id) {
					break;
				}
			}
			this.setState ({player_hand: data.player.list[i].hand});
			
			//if it's not the user's turn, tell the rest to choose whether he was cheating or not
			if(this.state.player_index != data.whoseTurn) {
				msg = 'Player ' + (data.whoseTurn + 1) + ' has made his move! Decide whether or not he is cheating.';
				this.setState({message: msg});
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

			//update private states, get client's index by linear searching
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id == this.props.socket.id) {
					break;
				}
			}
			
			//update user's hand
			this.setState ({player_hand: data.player.list[i].hand});
			
			//if it's the user's turn, tell him it is his turn
			if(this.player_index == data.whoseTurn) {
				var msg = 'It is now your turn!';
				this.setState({message: msg});
			}
			else {
				var msg = 'Waiting on player ' + (data.whoseTurn + 1) + " to make a move...";
				this.setState({message: msg});
			}
		}.bind(this));

		//When there is a winner
		this.props.socket.on('cheatWinnerFound', function(player_index) {
			var msg = 'Player ' + (player_index + 1) + ' has won the game!!!!!!';
			this.setState({last_action_tb: msg});
			alert(msg);
			alert('Shutting down the server. Re-create the server from the main page.');
			window.location.reload(true);
		}.bind(this));
	}

	state = {
		whoseTurn: -1,
		turn_phase: 0, //0: select phase, 1: cheat phase
		server_PIN: this.props.server_PIN,
		last_action_tb: "Cheat!",
		message: "Waiting for players...",
		selected_cards: [],
		value: 1,
		num: 2,
		declared_cards: {num: -1, val: -1},
		Discard_pile: [],
		playerID: -1,
		player_hand: [],
		player_index: -1,
	}

	symToNum = (sym) => {
		switch(sym) {
			case '2':
				return 0;
			case '3':
				return 1;
			case '4':
				return 2;
			case '5':
				return 3;
			case '6':
				return 4;
			case '7':
				return 5;
			case '8':
				return 6;
			case '9':
				return 7;
			case '10':
				return 8;
			case 'J':
				return 9;
			case 'Q':
				return 10;
			case 'K':
				return 11;
			case 'A':
				return 12;
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
		var valid = true;
		var msg;
		
		//check if number of declared cards is not 0
		if(this.state.selected_cards.length == 0) {
			msg = 'You have to play a card! Passing your turn is not allowed!';
			this.setState({message: msg});
			valid = false;
		}
		
		// check if number of declared cards is <5
		if(this.state.selected_cards.length > 4) {
			msg = 'You cannot declare more than 4 cards! (duh...)';
			this.setState({message: msg});
			valid = false;
		}
		
		// checking of declared_cards is empty
		if(parseInt(this.state.declared_cards.num) == -1 && this.state.declared_cards.val == -1) {
			firstTurn = true;
		}
		// check if cards declared is within +/- 1 of the previously declared card
		if(!firstTurn) {
			var minusone = (this.symToNum(this.state.declared_cards.val)- 1)%13;
			if(minusone < 0) {
				minusone += 13;
			}

			var isPlusOne = ((this.symToNum(this.state.declared_cards.val)+ 1)%13 == this.symToNum(this.refs.val.value));
			var isEqual = (this.symToNum(this.state.declared_cards.val) == this.symToNum(this.refs.val.value));
			var isMinusOne = (minusone == this.symToNum(this.refs.val.value));
			
			//console.log(isPlusOne);
			//console.log(isEqual);
			//console.log(isMinusOne);
			
			if(!(isPlusOne || isEqual || isMinusOne)) {
				msg = 'The number of the card you declared: ' + this.refs.val.value + ' is not within +/- 1 of the previously declared card: ' + this.state.declared_cards.val;
				this.setState({message: msg});
				valid = false;
			}
		}

		//if everything passes, we can submit the move to the server
		if(valid) {
			this.props.socket.emit('cheatSubmitClientPhase0', {
				player_index: this.state.player_index,
				pinNo: this.state.server_PIN,
				declared_cards: {num: parseInt(this.state.selected_cards.length), val: this.refs.val.value},
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

	render() {
		var playerhand = this.state.player_hand
		//Sorts hand according to value
		Sort.byValue(playerhand);
		var valoptions = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
		var numoptions = ['1','2','3','4']
		var selectedcards = this.state.selected_cards
		const listHand = playerhand.map((d) =>
		<button disabled = {this.disableSelectButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn)}className = "Cards" onClick = {() => {
			let index = playerhand.findIndex(x => x.name === d.name)
			playerhand.splice(index,1)
			this.setState({player_hand: playerhand})
			selectedcards.push(d)
			//this.handleSelect_Card(d)
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
							<label className = "label">Choose the card you are going to play:</label>
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

export default Cheat;
