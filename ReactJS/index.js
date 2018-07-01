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
		let values = [{sym :'2',num : 2},{sym :'3',num : 3},{sym :'4',num : 4},{sym :'5',num : 5},{sym :'6',num : 6},{sym :'7',num : 7},{sym :'8',num : 8}
					,{sym :'9',num : 9},{sym :'10',num : 10},{sym :'J',num : 11},{sym :'Q',num : 12},{sym :'K',num : 13},{sym :'A',num : 14}];
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

class playerList{
	constructor(num_players){
		this.list = [];
		let player = (name) => {
			this.name = name;
			this.score = 0;
			this.hand = [];
		return {name:this.name, score:this.score, hand:this.hand}
	}
		for(let i = 1; i <=num_players;i++) {
			this.list.push(player("Player " + i))
		}
	}
	print_list() {
	for(let i = 0;i<this.list.length;i++){
		console.log(this.list[i])
		}
	}
}

var portNum = 1520;
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

function findGame(pin) {
	var i, l = gameInstances.length;
	for(i=0;i<l;i++) {
		if(gameInstances[i].pinNo == pin) {
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
		PINNumList.push(gamePIN);
		socket.emit('receiveGamePin', gamePIN);
	});
	
	// Receive game pin
	socket.on('startNewServer', function(data) {
		var instance = {pinNo: data.pinNo, gametype: data.gametype, num_players: data.num_players, current_players: 1, deck: new Deck(), players: new playerList(data.num_players)};
		
		// initialising the deck
		instance.deck.generate_deck();
		instance.deck.shuffle();
		
		// dealing out the cards
		while(instance.deck.size() != 0) {
			let card = instance.deck.deal();
			instance.players.list[(instance.deck.size() + 1)]%instance.players.hand.push(card);
		}
		
		gameInstances.push(instance);
		console.log(socket.id + " has created a new room: " + data.pinNo);
	});
	
	// authentication of user
	socket.on('connectToRoom', function(pin) {
		var i, l = PINNumList.length, pinExists = false;
		for(i=0;i<l;i++) {
			if(PINNumList[i] == pin) {
				pinExists = true;
				break;
			}
		}
		
		if(pinExists) {
			socket.emit('AuthSuccess');
			socket.join(pin);
			console.log(socket.id + " has joined room " + pin);
		}
		else {
			socket.emit('AuthFail');
		}
	});
	
	
});

/* TODO:
- remove players from array upon disconnection
- fix callback issues in joinserver
- 
*/