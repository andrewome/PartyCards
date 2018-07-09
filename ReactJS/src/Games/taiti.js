import React, { Component } from 'react';
import './Games.css';
import Scoreboard from './scoreboard';
import Sort from './sorting';

//importing card images using webpack
function importAll(r) {
	let images = {};
	r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
	return images;
}

const images = importAll(require.context('./card_images', false, /\.(png|jpe?g|svg)$/));

class Taiti extends Component {
	constructor(props) {
		super(props);
		
		// When server emits the start game command
		this.props.socket.on('startGame', function(data) {
			var msg = ('The last man has joined! Game is now starting. Player ' + (data.whoseTurn + 1) + ' will start first.');
			this.setState({message: msg});
			//finding player index
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id === this.props.socket.id) {
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
		
		//Receiving data from server
		this.props.socket.on('taitiSubmitServer', function (data) {
			let msg = "Player " + (this.state.whoseTurn + 1) + " has made his/her move!"
			this.setState ({
				whoseTurn: data.whoseTurn,
				Discard_pile: data.Discard_pile,
				last_played_cards: data.last_played_cards,
				last_action_tb: msg,
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
			if(this.player_index === data.whoseTurn) {
				msg = 'It is now your turn!';
				this.setState({message: msg});
			}
			else {
				msg = 'Waiting on player ' + (data.whoseTurn + 1) + " to make a move...";
				this.setState({message: msg});
			}
		}.bind(this));	
		
		this.state = {
			whoseTurn: -1,
			server_PIN: this.props.server_PIN,
			last_action_tb: "Taiti!",
			message: "Waiting for players...",
			selected_cards: [],
			last_played_cards: [],
			Discard_pile: [],
			playerID: -1,
			player_hand: [],
			player_index: -1,
		}
	}
	
	//return strength of a card normally (2 is the largest in Taiti)
	defaultSymToNum = (sym) => {
		switch(sym) {
			case '3':
				return 0;
			case '4':
				return 1;
			case '5':
				return 2;
			case '6':
				return 3;
			case '7':
				return 4;
			case '8':
				return 5;
			case '9':
				return 6;
			case '10':
				return 7;
			case 'J':
				return 8;
			case 'Q':
				return 9;
			case 'K':
				return 10;
			case 'A':
				return 11;
			case '2':
				return 12;
			default:
				return -1;
		}
	}
	
	//return strength of a card in a straight
	straightSymToNum = (sym) => {
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

	//return strength of a suit in Taiti
	suitToNum = (suit) => {
		switch(suit) {
			case 'Diamonds':
				return 0;
			case 'Clubs':
				return 1;
			case 'Hearts':
				return 2;
			case 'Spades':
				return 3;
			default:
				return -1;
		}
	}
	
	//checks if a selection of cards is of a valid combination, assumes hand is sorted
	//returns -1 if false, returns other values for valid combinations (just not -1)
	//single = 10, double = 11, straight = 0, flush = 1, four of a kind = 2, full house = 3, straight flush = 4
	checkValidity = (cards) => {
		var i, j;
		// if number of cards isn't 1, 2, 3 or 5, it is not a valid combination
		if(!(cards.length === 1 || cards.length === 2 || cards.length === 5)) {
			return -1;
		}
		
		if(cards.length === 1) {
			return 10;
		}

		if(cards.length === 2) {
			if(cards[0].value.sym === cards[1].value.sym) {
				return 11;
			}
			else {
				return -1;
			}
		}

		if(cards.length === 5) {
			
			// checking for 4 of a kind
			var count;
			for(i=0;i<5;i++) {
				count = 1;
				for(j=0;j<5;j++) {
					if(i === j) {
						continue;
					}
					if(cards[i].value.sym === cards[j].value.sym) {
						count++;
					}
				}
				if(count === 4) {
					return 2;
				}
			}
			
			// checking for house
			var triplets = 0, doubles = 0;
			for(i=0;i<5;i++) {
				count = 1;
				for(j=0;j<5;j++) {
					if(i === j) {
						continue;
					}
					if(cards[i].value.sym === cards[j].value.sym) {
						count++;
					}
				}
				if(count === 3) {
					triplets++;
				}
				else if(count === 2) {
					doubles++;
				}
			}			
			if(triplets === 3 && doubles === 2) {
				return 3;
			}
			
			//checking for flush and straights
			var flush = false, straight = false;
			for(i=0;i<5;i++) {
				count = 1;
				for(j=0;j<5;j++) {
					if(i === j) {
						continue;
					}
					if(cards[i].suit === cards[j].suit) {
						count++;
					}
				}
				if(count === 5) {
					flush = true;
				}
			}
			
			count = 0;
			for(i=0;i<5;i++) {
				if(i !== 4 && this.straightSymToNum(cards[i].value.sym)+1 === this.straightSymToNum(cards[i+1].value.sym)) {
					count++;
				}
			}
			if(count === 4) {
				straight = true;
			}
			
			if(flush && straight) {
				return 4;
			}
			else if(flush && !straight) {
				return 1;
			}
			else if(!flush && straight) {
				return 0;
			}
			else if(!flush && !straight) {
				return -1;
			}
		}
	}
	
	//This function handles the values submitted during user turn
	handleSubmit = (e) => {
		Sort.byValue(this.state.selected_cards);
		var selected_cards_sorted = this.state.selected_cards;
		Sort.byValue(this.state.last_played_cards);
		var last_played_cards_sorted = this.state.last_played_cards;
		var isReset = false, valid = true, msg;
		var selected_highest, last_played_highest, i, count;
		
		//if last_played_cards array length is 0, means that the round has resetted
		if(this.state.last_played_cards.length === 0) {
			isReset = true;
		}
		
		if(this.state.selected_cards.length === 0) {
			msg = "You cannot submit 0 cards. Use the pass option instead!";
			valid = false;
		}
		
		//check if the combination of cards is valid
		if(this.checkValidity(selected_cards_sorted) !== -1) {
			valid = true;
		}
		else {
			msg = "Combination isn't valid";
			valid = false;
		}
		
		//compare with previously played card
		if(!isReset && valid) {
			// if number of last played cards is larger than selected cards, then the move is obviously invalid
			if(this.state.last_played_cards.length > this.state.selected_cards.length) {
				msg = "Number of cards played is smaller than last played cards";
				valid = false;
			}
			// if the number of played cards(checked if it is a valid combo) > last played cards, then move is valid
			else if(this.state.last_played_cards.length < this.state.selected_cards.length) {
				valid = true;
			}
			// if number of cards are the same
			else if(this.state.last_played_cards.length === this.state.selected_cards.length) {
				if(this.state.selected_cards.length === 1) {
					if(this.defaultSymToNum(this.state.selected_cards[0].value.sym) === this.defaultSymToNum(this.state.last_played_cards[0].value.sym)) {
						if(this.suitToNum(this.state.selected_cards[0].suit) > this.suitToNum(this.state.last_played_cards[0].suit)) {
							valid = true;
						}
						else {
							msg = "Suit of card played is smaller than suit of last played card";
							valid = false;
						}
					}
					else if(this.defaultSymToNum(this.state.selected_cards[0].value.sym) < this.defaultSymToNum(this.state.last_played_cards[0].value.sym)) {
						msg = "Value of card played is smaller than value of last played card";
						valid = false;
					}
					else if(this.defaultSymToNum(this.state.selected_cards[0].value.sym) > this.defaultSymToNum(this.state.last_played_cards[0].value.sym)) {
						valid = true;
					}
				}
				else if(this.state.selected_cards.length === 2) {
					if(this.defaultSymToNum(this.state.selected_cards[0].value.sym) === this.defaultSymToNum(this.state.last_played_cards[0].value.sym)) {
						// check for highest suit
						if(this.suitToNum(this.state.selected_cards[0].suit) > this.suitToNum(this.state.last_played_cards[0].suit)) {
							selected_highest = this.suitToNum(this.state.selected_cards[0].suit);
						}
						else {
							selected_highest = this.suitToNum(this.state.selected_cards[1].suit);
						}
						if(this.suitToNum(this.state.selected_cards[0].suit) > this.suitToNum(this.state.last_played_cards[0].suit)) {
							last_played_highest = this.suitToNum(this.state.last_played_cards[0].suit);
						}
						else {
							last_played_highest = this.suitToNum(this.state.last_played_cards[1].suit);
						}
						
						if(selected_highest > last_played_highest) {
							valid = true;
						}
						else {
							msg = "Suit of card played is smaller than suit of last played card";
							valid = false;
						}
						
					}
					else if(this.defaultSymToNum(this.state.selected_cards[0].value.sym) < this.defaultSymToNum(this.state.last_played_cards[0].value.sym)) {
						msg = "Value of card played is smaller than value of last played card";
						valid = false;
					}
					else if(this.defaultSymToNum(this.state.selected_cards[0].value.sym) > this.defaultSymToNum(this.state.last_played_cards[0].value.sym)) {
						valid = true;
					}
				}
				else if (this.state.selected_cards.length === 5) {
					//check type of 5 card combination; straight flush(4) > full house(3) > 4 of a kind(2) > flush(1) > straight(0)
					var selected_type = this.checkValidity(selected_cards_sorted), last_played_type = this.checkValidity(last_played_cards_sorted);

					//if selected hand is higher than last played, valid
					if(selected_type > last_played_type) {
						valid = true;
					}
					// else not valid,
					else if(selected_type < last_played_type) {
						msg = "Combination of cards selected is not as high as previously played cards combination";
						valid = false;
					}
					// if it's of the same type, compare the different types of 5 card combinations
					// if it's a straight, look at 5th card of sorted hand
					else if(selected_type === 0 && selected_type === last_played_type) {
						if(this.straightSymToNum(selected_cards_sorted[4].value.sym) === this.straightSymToNum(last_played_cards_sorted[4].value.sym)) {
							if(this.suitToNum(selected_cards_sorted[4].suit) > this.suitToNum(last_played_cards_sorted[4].suit)) {
								valid = true;
							}
							else {
								msg = "Suit of largest card played is smaller than previously played cards";
								valid = false;
							}
						}
						else if(this.straightSymToNum(selected_cards_sorted[4].value.sym) > this.straightSymToNum(last_played_cards_sorted[4].value.sym)) {
							valid = true;
						}
						else if(this.straightSymToNum(selected_cards_sorted[4].value.sym) < this.straightSymToNum(last_played_cards_sorted[4].value.sym)) {
							msg = "Value of largest card played is smaller than previously played cards";
							valid = false;
						}
					}
					
					// if it's a full house, look at value of the triplet
					else if(selected_type === 3 && selected_type === last_played_type) {
						var first, second, selected_triplet, last_played_triplet;
						
						first = this.defaultSymToNum(this.state.selected_cards[0].value.sym);
						count = 0;
						for(i=1;i<5;i++) {
							if(this.defaultSymToNum(this.state.selected_cards[i].value.sym) !== first) {
								second = this.defaultSymToNum(this.state.selected_cards[i].value.sym);	
							}
							else {
								count++;
							}
						}
						if(count === 3) {
							selected_triplet = first;
						}
						else {
							selected_triplet = second;
						}
						
						first = this.defaultSymToNum(this.state.last_played_cards[0].value.sym);
						count = 0;
						for(i=1;i<5;i++) {
							if(this.defaultSymToNum(this.state.last_played_cards[i].value.sym) !== first) {
								second = this.defaultSymToNum(this.state.last_played_cards[i].value.sym);	
							}
							else {
								count++;
							}
						}
						if(count === 3) {
							last_played_triplet = first;
						}
						else {
							last_played_triplet = second;
						}

						if(selected_triplet > last_played_triplet) {
							valid = true;
						}
						else {
							msg = "Value of selected triplet is smaller than that of previously played triplet";
							valid = false;
						}
					}
					
					// else look at the highest suit for the rest of the cases
					else if(selected_type === last_played_type && selected_type) {
						selected_highest = this.suitToNum(this.state.selected_cards[0].suit);
						last_played_highest = this.suitToNum(this.state.last_played_cards[0].suit);
						for(i=1;i<5;i++) {
							if(this.suitToNum(this.state.selected_cards[i].suit) > selected_highest) {
								selected_highest = this.suitToNum(this.state.selected_cards[i].suit);
							}
							if(this.suitToNum(this.state.last_played_cards[i].suit) > last_played_highest) {
								last_played_highest = this.suitToNum(this.state.last_played_cards[i].suit);
							}
						}
						
						if(selected_highest > last_played_highest) {
							valid = true;
						}
						else {
							msg = "Suit of selected cards is smaller than that of previously played cards";
							valid = false;
						}
					}
				}
			}
		}
		
		if(valid) {
			this.props.socket.emit('taitiSubmitClient', {
				player_index: this.state.player_index,
				pinNo: this.state.server_PIN,
				whoseTurn: this.state.whoseTurn,
				selected_cards: this.state.selected_cards,
				passVote: false,
			});
			//clear selected cards hand
			this.setState({selected_cards: []});
		}
		else {
			this.setState({message: msg});
		}
		e.preventDefault();
	}
	
	//this function handles passing of turn
	handlePass = () => {
		this.props.socket.emit('taitiSubmitClient', {
		player_index: this.state.player_index,
		pinNo: this.state.server_PIN,
		whoseTurn: this.state.whoseTurn,
		passVote: true,
		});
	}
	
	disableSelectButton = (index, whoseTurn) => {
		if(whoseTurn === index) {
			return false;
		}
		else {
			return true;
		}
	}	

	render() {
		var playerhand = this.state.player_hand;
		//Sorts hand according to value
		Sort.byValue(playerhand);
		var selectedcards = this.state.selected_cards;
		var last_played_cards = this.state.last_played_cards
		var stylename = "cards"
		
		const list_last_played = last_played_cards.map((d) => <img className = {stylename}  src = {images[d.value.sym + d.suit[0] + '.png']} />);				
		
		const listHand = playerhand.map((d) =>
			<img className = {stylename}  src = {images[d.value.sym + d.suit[0] + '.png']}
				onClick = {() =>{
					if(this.disableSelectButton(this.state.player_index, this.state.whoseTurn)){
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
					if(this.disableSelectButton(this.state.player_index, this.state.whoseTurn)){
					return;
				}
				let index = selectedcards.findIndex(x => x.name === d.name)
				selectedcards.splice(index, 1)
				playerhand.push(d)
				this.setState({player_hand: playerhand})
				this.setState({selected_cards: selectedcards})
				}}
			/>);

		return (
			<div className = "Parent">
				<div className = "scoreboard">
					<Scoreboard 
						server_PIN = {this.state.server_PIN}
						GameName = "Taiti"
						num_players = {this.props.num_players} 
						whoseTurn = {this.state.whoseTurn}
						player_index = {this.state.player_index}
					/>
				</div>
				<p>Last Played Cards:</p>
				<div className = "hand">
					{list_last_played}
				</div>
				<p>Your hand:</p>
				<div className = "hand">
					{listHand}
				</div>
				
				<p>Selected cards:</p>
				<div className = "hand">
					{listCards}
				</div>
				
				<button disabled = {this.disableSelectButton(this.state.player_index, this.state.whoseTurn)} className = "button" onClick = {this.handleSubmit}>Submit</button>
				<button disabled = {this.disableSelectButton(this.state.player_index, this.state.whoseTurn)} className = "button" onClick = {this.handlePass}>Pass</button>
				
				<div className = "statusbox">
					<p>{this.state.message}</p>
				</div>
				
				<h1 className = "discardpile">{this.state.last_action_tb}</h1>
			</div>
		);
	}
}

export default Taiti;
