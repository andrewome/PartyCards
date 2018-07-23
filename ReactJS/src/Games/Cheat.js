import React, { Component } from 'react';
import '../stylesheet/styles.css';
import GameInfo from './game_props/GameInfo';
import Sort from './game_props/sorting';
import Scoreboard from './game_props/scoreboard'

//importing card images using webpack
function importAll(r) {
	let images = {};
	r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
	return images;
}

const images = importAll(require.context('./game_props/card_images', false, /\.(png|jpe?g|svg)$/));

class Cheat extends Component {
	constructor(props) {
		super(props);

		this.state = {
			whoseTurn: -1,
			turn_phase: 0, //0: select phase, 1: cheat phase
			server_PIN: this.props.server_PIN,
			last_action_tb: "Cheat!",
			message: "Waiting for players...",
			selected_cards: [],
			declared_cards: {num: -1, val: -1},
			Discard_pile: [],
			playerID: -1,
			player_hand: [],
			player_index: -1,
			scoreboard: [],
		}
		
		// When server emits the start game command
		this.props.socket.on('startGame', function(data) {
			var msg;
			
			//finding player index
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id === this.props.socket.id) {
					break;
				}
			}
			
			//emit player index for server side to take note
			this.props.socket.emit('playerIndex', i);
			
			this.setState ({
				turn_phase: 0,
				server_PIN: data.pinNo,
				whoseTurn: parseInt(data.whoseTurn),
				player_hand: data.player.list[i].hand,
				player_index: parseInt(i),
				playerID: data.player.list[i].ID,
				scoreboard: data.scoreboard,
			});
			
			if(data.whoseTurn === this.state.player_index) {
				msg = ('Last man has joined! You will start the round.');
			}
			else {
				msg = ('The last man has joined! Game is now starting. Player ' + (data.whoseTurn + 1) + ' will start first.');
			}
			this.setState({message: msg});
		}.bind(this));
		
		//upon reconnection
		this.props.socket.on('reconnectSuccess', function(data, playerIndex) {
			//finding player index
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id === this.props.socket.id) {
					break;
				}
			}
			
			//send reconnection message
			var msg = ('Player ' + (playerIndex + 1) + ' has reconnected!');
			this.setState({last_action_tb: msg});			
			
			//setting states for reconnected user
			if(this.state.player_index === -1) {
				//emit player index for server side to take note
				this.props.socket.emit('playerIndex', i);
				
				this.setState ({
					server_PIN: data.pinNo,
					whoseTurn: parseInt(data.whoseTurn),
					player_hand: data.player.list[i].hand,
					player_index: parseInt(i),
					playerID: data.player.list[i].ID,
					scoreboard: data.scoreboard,
					declared_cards: data.declared_cards,
				});
				
				if(data.turn_phase === 0) {
					this.setState ({turn_phase: 0});
					
					//if it's not the user's turn, tell the rest to choose whether he was cheating or not
					if(this.state.player_index !== data.whoseTurn) {
						msg = 'Player ' + (data.whoseTurn + 1) + ' has made his move! Decide whether or not he is cheating.';
						this.setState({message: msg});
					}
				}
				else {
					this.setState ({turn_phase: 1});
					
					//if it's the user's turn, tell him it is his turn
					if(this.state.player_index === data.whoseTurn) {
						msg = 'It is now your turn!';
						this.setState({message: msg});
					}
					else {
						msg = 'Waiting on player ' + (data.whoseTurn + 1) + " to make a move...";
						this.setState({message: msg});
					}
				}
			}
		}.bind(this));
		
		//when a player disconnects
		this.props.socket.on('playerDisconnected', function(msg) {
			this.setState({last_action_tb: msg});
		}.bind(this));
		
		//Phase 0 actions
		this.props.socket.on('cheatSubmitServerPhase0', function(data) {
			//update the shared states (turn_phase, whoseTurn, discard_pile, declared_cards)
			let msg = "Player " + (this.state.whoseTurn + 1) + " plays " + data.declared_cards.num + " cards of " + data.declared_cards.val;
			this.setState ({
				turn_phase: data.turn_phase,
				Discard_pile: data.Discard_pile,
				declared_cards: data.declared_cards,
				last_action_tb: msg,
				scoreboard: data.scoreboard,
			});

			//update private states, get client's index by linear searching
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id === this.props.socket.id) {
					break;
				}
			}
			this.setState ({player_hand: data.player.list[i].hand});

			//if it's not the user's turn, tell the rest to choose whether he was cheating or not
			if(this.state.player_index !== data.whoseTurn) {
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
				declared_cards: data.declared_cards,
				last_action_tb: msg,
				scoreboard: data.scoreboard,
			});

			//update private states, get client's index by linear searching
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id === this.props.socket.id) {
					break;
				}
			}

			//update user's hand
			this.setState ({player_hand: data.player.list[i].hand});

			//if it's the user's turn, tell him it is his turn
			if(this.state.player_index === data.whoseTurn) {
				msg = 'It is now your turn!';
				this.setState({message: msg});
			}
			else {
				msg = 'Waiting on player ' + (data.whoseTurn + 1) + " to make a move...";
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
			default:
				return -1;
		}
	}

	//This function handles the values submitted during phase 0 or user turn phase
	handleSubmit = (e) => {
		var firstTurn = false;
		var valid = true;
		var msg;
		//check if number of declared cards is not 0
		if(this.state.selected_cards.length === 0) {
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
		if(parseInt(this.state.declared_cards.num) === -1 && this.state.declared_cards.val === -1) {
			firstTurn = true;
		}
		// check if cards declared is within +/- 1 of the previously declared card
		if(!firstTurn) {
			var minusone = (this.symToNum(this.state.declared_cards.val)- 1)%13;
			if(minusone < 0) {
				minusone += 13;
			}

			var isPlusOne = ((this.symToNum(this.state.declared_cards.val)+ 1)%13 === this.symToNum(this.refs.val.value));
			var isEqual = (this.symToNum(this.state.declared_cards.val) === this.symToNum(this.refs.val.value));
			var isMinusOne = (minusone === this.symToNum(this.refs.val.value));

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
		
		this.setState({turn_phase: 0});
	}

	disableSelectButton = (phase, index, whoseTurn) => {
		if(phase === 0) {
			if(whoseTurn === index) {
				return false;
			}
			else {
				return true;
			}
		}
		else {
			if(whoseTurn === index) {
				return true;
			}
			else {
				return true;
			}
		}
	}

	disableCheatButton = (phase, index, whoseTurn) => {
		if(phase === 0) {
			if(whoseTurn === index) {
				return true;
			}
			else {
				return true;
			}
		}
		else {
			if(whoseTurn === index) {
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
		var valoptions = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
		var selectedcards = this.state.selected_cards;

		const listHand = playerhand.map((d) =>
			<img className = "cards"  src = {images[d.value.sym + d.suit[0] + '.png']}
				onClick = {() =>{
					if(this.disableSelectButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn)){
					return;
				}
				let index = playerhand.findIndex(x => x.name === d.name)
				playerhand.splice(index, 1)
				selectedcards.push(d)
				this.setState({player_hand: playerhand})
				this.setState({selected_cards: selectedcards})
				}}
			/>
		);
		const listCards = selectedcards.map((d) =>
			<img className = "scards" src ={images[d.value.sym + d.suit[0] + '.png']}
				onClick = { () => {
					if(this.disableSelectButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn)){
					return;
				}
				let index = selectedcards.findIndex(x => x.name === d.name)
				selectedcards.splice(index, 1)
				playerhand.push(d)
				this.setState({player_hand: playerhand})
				this.setState({selected_cards: selectedcards})
				}}
			/>);

		const listvaloptions = valoptions.map((index) => <option value = {index} key = {index}>{index}</option>)

		return (
			<div className = "Game">
				<div className = "scoreboard-table">
					<GameInfo
						server_PIN = {this.props.server_PIN}
						GameName = {this.props.GameName}
						num_players = {this.props.num_players}
						current_players = {this.props.current_players}
						whoseTurn = {this.state.whoseTurn}
					/>
						
					<Scoreboard
						GameName = {this.props.GameName}
						whoseTurn = {this.state.whoseTurn}
						player_index = {this.state.player_index}
						scoreboard = {this.state.scoreboard}
						discard_pile = {this.state.Discard_pile.length}
					/>
				</div>
				
				{(!(parseInt(this.state.declared_cards.num) === -1 && this.state.declared_cards.val === -1)) &&
					<p><h1>Last declared card(s): {this.state.declared_cards.num} cards of {this.state.declared_cards.val}</h1></p>
				}
				
				<p><h1>Your hand:</h1></p>
				<div className = "hand">
					{listHand}
				</div>
				
				{!this.disableSelectButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn) && selectedcards.length !== 0 &&
					<p><h1>Selected cards:</h1></p>
				}
				{!this.disableSelectButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn) &&
					<div className = "selected_cards">
						{listCards}
					</div>
				}
				
				{!this.disableSelectButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn) && selectedcards.length !== 0 &&
					<form onSubmit = {this.handleSubmit.bind(this)}>
						<label className = "label">Choose the card you are going to play:</label>
							<select ref = "val" className = "dropdown">
								{listvaloptions}
							</select>
						<input type = "submit" value = "Play cards"/>
					</form>
				}
				
				<p>
					{!this.disableCheatButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn) &&
						<button className = "button" onClick = {this.handleCallCheat}>Call Cheat!</button>
					}
					{!this.disableCheatButton(this.state.turn_phase, this.state.player_index, this.state.whoseTurn) && 
						<button className = "button" onClick = {this.handleDontCallCheat}>Don't Call Cheat!</button>
					}
				</p>
				
				<div className = "statusbox">
					<p>{this.state.message}</p>
				</div>

				<h1 className = "discardpile">{this.state.last_action_tb}</h1>
			</div>
		);			
	}
}

export default Cheat;
