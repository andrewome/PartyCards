import express from 'express'
import socket from 'socket.io'

class Deck {
	constructor() {
		this.deck = [];
		this.dealt_cards = [];
	}

	generate_deck() {
		let card = (suit,value) => {
			this.name = value.sym + ' of ' + suit
			this.suit = suit
			this.value = value
			return {name:this.name, suit:this.suit, value:this.value}
		};
		//let values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
		let values = [{sym :'2',num : 0},{sym :'3',num : 1},{sym :'4',num : 2},{sym :'5',num : 3},{sym :'6',num : 4},{sym :'7',num : 5},{sym :'8',num : 6}
					,{sym :'9',num : 7},{sym :'10',num : 8},{sym :'J',num : 9},{sym :'Q',num : 10},{sym :'K',num : 11},{sym :'A',num : 12}];
		let suits = ['Clubs','Diamonds','Hearts','Spades'];
		for(let i = 0;i<suits.length;i++) {
			for(let j = 0;j < values.length;j++) {
				this.deck.push(card(suits[i],values[j]));
			}
		}
	}

	print_deck() {
		if(this.deck.length == 0){
			console.log("The deck has not been generated")
		}
		else {
			for(let i = 0;i<this.deck.length;i++){
			console.log(this.deck[i].name)
			}
		}
	}
	shuffle() {
		let index = this.deck.length, temp_val, rand_index
		while(0 != index) {
			rand_index = Math.floor(Math.random() * index)
			index -= 1;
			temp_val = this.deck[index]
			this.deck[index] = this.deck[rand_index]
			this.deck[rand_index] = temp_val
		}
	}
	top_deck() {
		return this.deck[0].name
	}
	deal() {
		//let card be the top card of the deck
		let card = this.deck.shift()
		this.dealt_cards.push(card);
		return card;
	}
	size () {
		return this.deck.length
	}
}

class player {
	constructor(num_players){
		this.list = [];
		let player = (name) => {
			this.name = name;
			this.score = 0;
			this.hand = [];
			this.id = "";
			this.cheatVote = -1; //0 = false, 1 = true
			return {name:this.name, score:this.score, hand:this.hand, id:this.id};
		}
		for(let i = 1; i <=num_players;i++) {
			this.list.push(player("Player " + i));
		}
	}

	print_list() {
		for(let i = 0;i<this.list.length;i++) {
			console.log(this.list[i]);
		}
	}

	resetCheatVotes() {
		for(var i=0;i<this.list.length;i++) {
			this.list[i].cheatVote = -1;
		}
	}
}

var portNum = 1521;
// App setup
var app = express();
var server = app.listen(portNum, function() {
	console.log('Server has been started. Port number = ' + portNum);
});

// Set up standard file
app.use(express.static('public'));

// Socket setup
let io = socket(server);

// Server side variables
var connected_ids = [];
var gameInstances = [];
var PINNumList = [];

// function to print all connected IDs that are in the server now
function printConnectedIDs() {
	var i, size = connected_ids.length;
	console.log("Currently there are " + size + " user(s) in your server.");
	for(i=0;i<size;i++) {
		console.log(i+1 + ". ID: " + connected_ids[i]);
	}
	console.log('');
}

// function to delete a certain id from our list of ids array
function delete_id(id) {
	var i, size = connected_ids.length;
	for(i=0;i<size;i++) {
		if(connected_ids[i] == id) {
			break;
		}
	}
	connected_ids.splice(i, 1);
	console.log('');
}

// function generate a number between 0-9
function generateRandNum() {
	return Math.floor(Math.random() * (9 - 0 + 1)) + 0;
}

// random 5 digit game PIN generator function
function generateGamePIN() {
	var gamePIN = generateRandNum();
	gamePIN.toString();
	for(var i=0;i<4;i++) {
		gamePIN += generateRandNum().toString();
	}
	return gamePIN;
}

function findGameInstance(pin) {
	var i, l = gameInstances.length;
	for(i=0;i<l;i++) {
		if(gameInstances[i].pinNo == pin) {
			break;
		}
	}
	return i;
}

function findPINNumList(pin) {
	var i, l = gameInstances.length;
	for(i=0;i<l;i++) {
		if(PINNumList[i].pinNo == pin) {
			break;
		}
	}
	return i;
}

// All backend functions here
io.on('connection', function(socket) {
	// When connected, output message onto server side console, add to list of connected clients
	console.log(socket.id + " has made socket connection to server");
	connected_ids.push(socket.id);
	printConnectedIDs();

	// When disconnected, output message to server side console, and remove from list of connected clients
	// check whether or not the room that this socket.id was in is empty. If empty, remove from game initiations
	socket.on('disconnect', function() {
		console.log(socket.id + " has disconnected from the server");
		delete_id(socket.id);
		
		//printConnectedIDs();
	});

	//initial check if generated game pin is unique
	socket.on('checkGamePin', function() {
		var gamePIN = generateGamePIN(), isTaken = false;
		var i, l = PINNumList.length;
		for(i=0;i<l;i++) {
			if(PINNumList[i].pinNo == gamePIN) {
				isTaken = true;
				break;
			}
		}
		// if there's an instance of the same PIN no., generate a new one until it is unique.
		if(isTaken) {
			while(isTaken) {
				gamePIN = generateGamePIN();
				for(i=0;i<l;i++) {
					if(PINNumList[i].pinNo == gamePIN) {
						continue;
					}
				}
				isTaken = false;
			}
		}
		PINNumList.push({pinNo: gamePIN, current_players: 0});
		socket.emit('receiveGamePin', gamePIN);
	});

	// create a room
	socket.on('startNewServer', function(data) {
		//randomly generate which player will start first
		var whoseTurn = Math.floor((Math.random()*100) + 1)%data.num_players;
		var instance = {
			whoseTurn: whoseTurn,
			pinNo: data.pinNo,
			gametype: data.gameType,
			num_players: data.num_players,
			deck: new Deck(),
			player: new player(data.num_players),
			Discard_pile: [],
			declared_cards: {},
			turn_phase: 0,
		};

		gameInstances.push(instance);
		console.log(socket.id + " has created a new room: " + data.pinNo);
	});

	// authentication of user
	socket.on('connectToRoom', function(pin) {

		//check if PIN number exists
		var i, l = PINNumList.length, pinExists = false;
		for(i=0;i<l;i++) {
			if(PINNumList[i].pinNo == pin) {
				pinExists = true;
				break;
			}
		}

		if(pinExists) {
			var PinNumListIndex = findPINNumList(pin);
			var gameInstancesIndex = findGameInstance(pin);
			var isFull = false;

			//check whether server is full first, if full reject connection
			if(PINNumList[PinNumListIndex].current_players >= gameInstances[gameInstancesIndex].num_players) {
				//reject this connection
				socket.emit('AuthFail', 'server is currently full');
				isFull = true;
			}

			if(!isFull) {
				socket.emit('AuthSuccess',gameInstances[gameInstancesIndex]);
				//add socket ID into player ID
				gameInstances[gameInstancesIndex].player.list[PINNumList[PinNumListIndex].current_players].id = socket.id;
				//increment current number of players within the server
				PINNumList[PinNumListIndex].current_players++;
				socket.join(pin);
				console.log(socket.id + " has joined room " + pin + ", number of players inside: " + PINNumList[PinNumListIndex].current_players);

				//check if game server is full, if full, start game
				if(PINNumList[PinNumListIndex].current_players == gameInstances[gameInstancesIndex].num_players) {

					// initialising the deck
					gameInstances[gameInstancesIndex].deck.generate_deck();
					gameInstances[gameInstancesIndex].deck.shuffle();

					// dealing out the cards
					while(gameInstances[gameInstancesIndex].deck.size() != 0) {
						let card = gameInstances[gameInstancesIndex].deck.deal();
						gameInstances[gameInstancesIndex].player.list[(gameInstances[gameInstancesIndex].deck.size() + 1)%gameInstances[gameInstancesIndex].num_players].hand.push(card);
					}

					io.sockets.in(pin).emit('startGame', gameInstances[gameInstancesIndex]);
					console.log("Server " + gameInstances[gameInstancesIndex].pinNo + " has started their game!");
				}

			}
		}
		else {
			socket.emit('AuthFail', 'server does not exist');
		}
	});


/*-----------------------
|						 |
|						 |
|'Cheat!' functions here |
|						 |
|						 |
------------------------*/
	//When the selected player submits his declared & selected cards (after passing client checks)
	//we want to update his hand, discard pile, declared cards and change turn phase to 1
	socket.on('cheatSubmitClientPhase0', function(data) {
		var gameInstanceIndex = findGameInstance(data.pinNo);

		//remove cards from player's hand and add to discard pile
		for(var i=0;i<data.selected_cards.length;i++) {
			gameInstances[gameInstanceIndex].Discard_pile.push(data.selected_cards[i]);
			for(var j=0;j<gameInstances[gameInstanceIndex].player.list[data.player_index].hand.length;j++) {
				if(JSON.stringify(data.selected_cards[i]) == JSON.stringify(gameInstances[gameInstanceIndex].player.list[data.player_index].hand[j])) {
					gameInstances[gameInstanceIndex].player.list[data.player_index].hand.splice(j, 1);
				}
			}
		}

		//add declared cards
		gameInstances[gameInstanceIndex].declared_cards = data.declared_cards;

		//update the turn phase to phase 1
		gameInstances[gameInstanceIndex].turn_phase = 1;
		io.sockets.in(data.pinNo).emit('cheatSubmitServerPhase0', gameInstances[gameInstanceIndex]);
	});


	//If we get num_players # of not cheating, continue to next round
	//else, 1st person to send 'is cheating', check with actual card
	//and continue to next round
	socket.on('cheatSubmitClientPhase1', function(data) {
		//console.log(data);
		var gameInstanceIndex = findGameInstance(data.pinNo);
		var counter = 0, i

		//if this client thinks that he's a cheater, check if he really did cheat
		if(data.cheatVote) {
			var cheated = false;
			for(i=0;i<gameInstances[gameInstanceIndex].declared_cards.num;i++) {
				//check from the back of the array, because discarded cards are pushed there
				if(gameInstances[gameInstanceIndex].Discard_pile[gameInstances[gameInstanceIndex].Discard_pile.length - 1 - i].value.sym != gameInstances[gameInstanceIndex].declared_cards.val) {
					cheated = true;
					break;
				}
			}

			//if player really cheated, give discard pile to whoseturn (the person's turn)
			if(cheated) {
				for(i=0;i<gameInstances[gameInstanceIndex].Discard_pile.length;i++) {
					gameInstances[gameInstanceIndex].player.list[data.whoseTurn].hand.push(gameInstances[gameInstanceIndex].Discard_pile[i]);
				}
			}
			// else give discard pile to accusor (player_index)
			else {
				for(i=0;i<gameInstances[gameInstanceIndex].Discard_pile.length;i++) {
					gameInstances[gameInstanceIndex].player.list[data.player_index].hand.push(gameInstances[gameInstanceIndex].Discard_pile[i]);
				}
			}

			//empty discard pile
			gameInstances[gameInstanceIndex].Discard_pile.splice(0, gameInstances[gameInstanceIndex].Discard_pile.length);

			//generate messages
			var msgCheated = "Player " + (data.player_index + 1) + " guessed correctly! Player " + (data.whoseTurn + 1) + " was indeed cheating! Player " + (data.whoseTurn + 1) + " gets the entire discard pile!";
			var msgNotCheated = "Player " + (data.player_index + 1) + " guessed incorrectly! Player " + (data.whoseTurn + 1) + " was not cheating! Player " + (data.player_index + 1) + " gets the entire discard pile!";

			//change phase to 0 + next person's turn + reset cheatVote var + reset declared card
			gameInstances[gameInstanceIndex].whoseTurn = (gameInstances[gameInstanceIndex].whoseTurn + 1)%gameInstances[gameInstanceIndex].num_players;
			gameInstances[gameInstanceIndex].turn_phase = 0;
			gameInstances[gameInstanceIndex].player.resetCheatVotes();
			gameInstances[gameInstanceIndex].declared_cards.num = -1;
			gameInstances[gameInstanceIndex].declared_cards.val = -1;
			if(cheated) {
				io.sockets.in(data.pinNo).emit('cheatSubmitServerPhase1', gameInstances[gameInstanceIndex], msgCheated);
				//console.log(gameInstances[gameInstanceIndex]);
			}
			else {
				io.sockets.in(data.pinNo).emit('cheatSubmitServerPhase1', gameInstances[gameInstanceIndex], msgNotCheated);
				//console.log(gameInstances[gameInstanceIndex]);
			}
		}
		// else add to the counter
		else {
			gameInstances[gameInstanceIndex].player.list[data.player_index].cheatVote = 0;
			//check whether it equals to num_players
			for(i=0;i<gameInstances[gameInstanceIndex].num_players;i++) {
				if(gameInstances[gameInstanceIndex].player.list[i].cheatVote == 0) {
					counter++;
				}
			}
			//if it equals, send message to room for next turn, and set phase back to 0 + next turn + reset votes
			if(counter == gameInstances[gameInstanceIndex].num_players - 1) {
				var msg = "Everyone voted that player " + (data.whoseTurn + 1) + " is not cheating! Moving on to the next round!";
				gameInstances[gameInstanceIndex].whoseTurn = (gameInstances[gameInstanceIndex].whoseTurn + 1)%gameInstances[gameInstanceIndex].num_players;
				gameInstances[gameInstanceIndex].turn_phase = 0;
				gameInstances[gameInstanceIndex].player.resetCheatVotes();
				io.sockets.in(data.pinNo).emit('cheatSubmitServerPhase1', gameInstances[gameInstanceIndex], msg);
				//console.log(gameInstances[gameInstanceIndex]);
			}
		}

		var winner_found = false;
		//Check if there's any winners (empty hands) past this stage
		for(i=0;i<gameInstances[gameInstanceIndex].player.list.length;i++) {
			if(gameInstances[gameInstanceIndex].player.list[i].hand.length == 0) {
				winner_found = true;
				break;
			}
		}
		if(winner_found) {
			io.sockets.in(data.pinNo).emit('cheatWinnerFound', i);
		}
	});
});

/* TODO:
- remove players from arrays (instance and gamepinlist) upon disconnection
- fix callback issues in joinserver
- server crashes when someone tries to join at svrcreate page
*/
