import express from 'express';
import socket from 'socket.io';
import Deck from './constructors/Deck';
import player from './constructors/player'

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

//Removes cards in list sel_cards from the list hand
function handremove(hand,sel_cards){
	for(let i = 0; i< sel_cards.length;i++){
		let index = hand.findIndex(x => x.name === sel_cards[i].name);
		if(index != -1){
			hand.splice(index, 1);
		}
	}
	return hand;
}

function HeartsValue(card){
	if(card.suit === "Hearts"){
		return 1;
	}
	else if(card.name === "Q of Spades"){
		return 13;
	}
	else{
		return 0;
	}
}

function HeartsShootMoon(index){
	if(index>=0){
		return "Player " + (index+1) + " shot the Moon! ";
	}
	else{
		return "";
	}
}

// All backend functions here
io.on('connection', function(socket) {
	// When connected, output message onto server side console, add to list of connected clients
	console.log(socket.id + " has made socket connection to server");
	connected_ids.push(socket.id);
	printConnectedIDs();

	//add socket indentification
	socket.PIN = "none";

	// When disconnected, output message to server side console, and remove from list of connected clients
	// check whether or not the room that this socket.id was in is empty. If empty, remove from game initiations
	socket.on('disconnect', function() {
		console.log(socket.id + " has disconnected from the server");
		delete_id(socket.id);

		//if someone disconnects, and there is a PIN attached to his socket, means he has left an ongoing game. free up the game on that instance
		if(socket.PIN !== "none") {
			var gameInstanceIndex = findGameInstance(socket.PIN);
			gameInstances[gameInstanceIndex].current_players--;
			gameInstances[gameInstanceIndex].disconnected_index.push(socket.player_index);
			io.sockets.in(socket.PIN).emit('numPlayers', gameInstances[gameInstanceIndex].current_players);
			let msg = "Player " + (socket.player_index + 1) + " has disconnected!";
			io.sockets.in(socket.PIN).emit('playerDisconnected', msg);
		}
	});

	//initial check if generated game pin is unique
	socket.on('checkGamePin', function() {
		var gamePIN = generateGamePIN(), isTaken = false;
		var i, l = PINNumList.length;
		for(i=0;i<l;i++) {
			if(PINNumList[i] == gamePIN) {
				isTaken = true;
				break;
			}
		}
		// if there's an instance of the same PIN no., generate a new one until it is unique.
		if(isTaken) {
			while(isTaken) {
				gamePIN = generateGamePIN();
				for(i=0;i<l;i++) {
					if(PINNumList[i] == gamePIN) {
						continue;
					}
				}
				isTaken = false;
			}
		}
		PINNumList.push(gamePIN);
		socket.emit('receiveGamePin', gamePIN);
	});

	// create a room
	socket.on('startNewServer', function(data) {
		//randomly generate which player will start first
		var whoseTurn = Math.floor((Math.random()*100) + 1)%data.num_players;
		var instance = {
			started: false,
			scoreboard: [],
			whoseTurn: whoseTurn,
			pinNo: data.pinNo,
			gametype: data.gameType,
			num_players: data.num_players,
			current_players: 0,
			deck: new Deck(),
			player: new player(data.num_players),
			Discard_pile: [],
			declared_cards: {},
			last_played_cards: [],
			turn_phase: 0,
			lastPersonPlayed: -1,
			disconnected_index: [],
		};
		gameInstances.push(instance);
		console.log(socket.id + " has created a new room: " + data.pinNo);
	});

	// authentication of user
	socket.on('connectToRoom', function(pin) {

		//check if PIN number exists
		var i, l = PINNumList.length, pinExists = false;
		for(i=0;i<l;i++) {
			if(PINNumList[i] == pin) {
				pinExists = true;
				break;
			}
		}

		if(pinExists) {
			var PinNumListIndex = findPINNumList(pin);
			var gameInstanceIndex = findGameInstance(pin);
			var isFull = false, i, j;

			//check whether server is full first, if full reject connection
			if(gameInstances[gameInstanceIndex].current_players >= gameInstances[gameInstanceIndex].num_players) {
				//reject this connection
				socket.emit('AuthFail', 'server is currently full');
				isFull = true;
			}

			if(!isFull) {
				//if game hasn't started yet
				if(gameInstances[gameInstanceIndex].started === false) {
					//add socket ID into player ID
					gameInstances[gameInstanceIndex].player.list[gameInstances[gameInstanceIndex].current_players].id = socket.id;

					//increment current number of players within the server
					gameInstances[gameInstanceIndex].current_players++;
					socket.join(pin);
					console.log(socket.id + " has joined room " + pin + ", number of players inside: " + gameInstances[gameInstanceIndex].current_players);

					//emit game instance to client
					socket.emit('AuthSuccess', gameInstances[gameInstanceIndex]);

					//save PIN number to said ID
					socket.PIN = pin;

					//emit current number of players in server
					io.sockets.in(pin).emit('numPlayers', gameInstances[gameInstanceIndex].current_players);

					//check if game server is full, if full, start game
					if(gameInstances[gameInstanceIndex].current_players == gameInstances[gameInstanceIndex].num_players) {

						// initialising scoreboard
						for(let i = 0;i<gameInstances[gameInstanceIndex].num_players;i++){
							gameInstances[gameInstanceIndex].scoreboard.push({name:gameInstances[gameInstanceIndex].player.list[i].name, score: gameInstances[gameInstanceIndex].player.list[i].score, rdscore: 0})
						}

						// initialising the deck
						gameInstances[gameInstanceIndex].deck.generate_deck();
						gameInstances[gameInstanceIndex].deck.shuffle();

						//if game is taiti, whoseturn should go to whoever who has 3 of diamonds
						if(gameInstances[gameInstanceIndex].gametype.valueOf() === "Taiti".valueOf()) {
							for(i=0;i<gameInstances[gameInstanceIndex].num_players;i++) {
								for(j=0;j<gameInstances[gameInstanceIndex].player.list[i].hand.length;j++) {
									if(gameInstances[gameInstanceIndex].player.list[i].hand[j].name.valueOf() === "3 of Diamonds".valueOf()) {
										gameInstances[gameInstanceIndex].whoseTurn = i;
										break;
									}
								}
							}
						}

						// dealing out the cards
						// for taiti, if number of players = 3, means there'll be an excess card. This card goes to the holder of the 3 of diamonds
						if(gameInstances[gameInstanceIndex].gametype.valueOf() === "Taiti".valueOf() && gameInstances[gameInstanceIndex].num_players === 3) {
							var count = 0;
							for(i=0;i<51;i++) {
								let card = gameInstances[gameInstanceIndex].deck.deal();
								gameInstances[gameInstanceIndex].player.list[count % gameInstances[gameInstanceIndex].num_players].hand.push(card);
								count++;
							}
							let card = gameInstances[gameInstanceIndex].deck.deal();
							gameInstances[gameInstanceIndex].player.list[gameInstances[gameInstanceIndex].whoseTurn].hand.push(card);
						}
						else {
							while(gameInstances[gameInstanceIndex].deck.size() !== 0) {
								let card = gameInstances[gameInstanceIndex].deck.deal();
								gameInstances[gameInstanceIndex].player.list[(gameInstances[gameInstanceIndex].deck.size() + 1)%gameInstances[gameInstanceIndex].num_players].hand.push(card);
							}
						}

						//Initialise values of PassVotes
						gameInstances[gameInstanceIndex].player.resetPassVotes();

						//if game is cheat/taiti, the scores are the number of cards in ones hand
						if(gameInstances[gameInstanceIndex].gametype.valueOf() === "Taiti".valueOf() || gameInstances[gameInstanceIndex].gametype.valueOf() === "Cheat".valueOf()) {
							for(i=0;i<gameInstances[gameInstanceIndex].num_players;i++) {
								gameInstances[gameInstanceIndex].scoreboard[i].score = gameInstances[gameInstanceIndex].player.list[i].hand.length;
							}
						}

						gameInstances[gameInstanceIndex].started = true;
						io.sockets.in(pin).emit('startGame', gameInstances[gameInstanceIndex]);
						console.log("Server " + gameInstances[gameInstanceIndex].pinNo + " has started their game!");
					}
				}

				//someone is reconnecting into the server
				else {
					var playerIndex = gameInstances[gameInstanceIndex].disconnected_index.pop();

					//add socket ID into player ID
					gameInstances[gameInstanceIndex].player.list[playerIndex].id = socket.id;

					//increment current number of players within the server
					gameInstances[gameInstanceIndex].current_players++;
					socket.join(pin);
					console.log(socket.id + " has joined room " + pin + ", number of players inside: " + gameInstances[gameInstanceIndex].current_players);

					//emit game instance to client
					socket.emit('AuthSuccess', gameInstances[gameInstanceIndex]);
					io.sockets.in(pin).emit('reconnectSuccess', gameInstances[gameInstanceIndex], playerIndex);

					//save PIN number to said ID
					socket.PIN = pin;

					//emit current number of players in server
					io.sockets.in(pin).emit('numPlayers', gameInstances[gameInstanceIndex].current_players);
				}
			}
		}
		else {
			socket.emit('AuthFail', 'server does not exist');
		}
	});

	socket.on('playerIndex', function(i) {
		socket.player_index = i;
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

		//change value of cards left in player's hand
		gameInstances[gameInstanceIndex].scoreboard[data.player_index].score = gameInstances[gameInstanceIndex].player.list[data.player_index].hand.length;

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

				//change value of cards left in player's hand
				gameInstances[gameInstanceIndex].scoreboard[data.whoseTurn].score = gameInstances[gameInstanceIndex].player.list[data.whoseTurn].hand.length;
			}
			// else give discard pile to accusor (player_index)
			else {
				for(i=0;i<gameInstances[gameInstanceIndex].Discard_pile.length;i++) {
					gameInstances[gameInstanceIndex].player.list[data.player_index].hand.push(gameInstances[gameInstanceIndex].Discard_pile[i]);
				}

				//change value of cards left in player's hand
				gameInstances[gameInstanceIndex].scoreboard[data.player_index].score = gameInstances[gameInstanceIndex].player.list[data.player_index].hand.length;
			}

			//empty discard pile
			gameInstances[gameInstanceIndex].Discard_pile.splice(0, gameInstances[gameInstanceIndex].Discard_pile.length);

			//generate messages
			var msgCheated = "Player " + (data.player_index + 1) + " guessed correctly! Player " + (data.whoseTurn + 1) + " was indeed cheating! Player " + (data.whoseTurn + 1) + " gets the entire discard pile!";
			var msgNotCheated = "Player " + (data.player_index + 1) + " guessed incorrectly! Player " + (data.whoseTurn + 1) + " was not cheating! Better luck next time! Player " + (data.player_index + 1) + " gets the entire discard pile!";

			//change phase to 0 + next person's turn + reset passVote var + reset declared card
			gameInstances[gameInstanceIndex].whoseTurn = (gameInstances[gameInstanceIndex].whoseTurn + 1)%gameInstances[gameInstanceIndex].num_players;
			gameInstances[gameInstanceIndex].turn_phase = 0;
			gameInstances[gameInstanceIndex].player.resetPassVotes();
			gameInstances[gameInstanceIndex].declared_cards.num = -1;
			gameInstances[gameInstanceIndex].declared_cards.val = -1;
			if(cheated) {
				io.sockets.in(data.pinNo).emit('cheatSubmitServerPhase1', gameInstances[gameInstanceIndex], msgCheated);
			}
			else {
				io.sockets.in(data.pinNo).emit('cheatSubmitServerPhase1', gameInstances[gameInstanceIndex], msgNotCheated);
			}
		}
		// else add to the counter
		else {
			gameInstances[gameInstanceIndex].player.list[data.player_index].passVote = 0;
			//check whether it equals to num_players
			for(i=0;i<gameInstances[gameInstanceIndex].num_players;i++) {
				if(gameInstances[gameInstanceIndex].player.list[i].passVote == 0) {
					counter++;
				}
			}
			//if it equals, send message to room for next turn, and set phase back to 0 + next turn + reset votes
			if(counter == gameInstances[gameInstanceIndex].num_players - 1) {
				var msg = "Everyone voted that player " + (data.whoseTurn + 1) + " is not cheating! Moving on to the next round!";
				//change value of cards left in player's hand
				gameInstances[gameInstanceIndex].scoreboard[data.player_index].score = gameInstances[gameInstanceIndex].player.list[data.player_index].hand.length;
				gameInstances[gameInstanceIndex].whoseTurn = (gameInstances[gameInstanceIndex].whoseTurn + 1)%gameInstances[gameInstanceIndex].num_players;
				gameInstances[gameInstanceIndex].turn_phase = 0;
				gameInstances[gameInstanceIndex].player.resetPassVotes();
				io.sockets.in(data.pinNo).emit('cheatSubmitServerPhase1', gameInstances[gameInstanceIndex], msg);
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

/*-----------------------
|						 |
|						 |
|'Taiti' functions here  |
|						 |
|						 |
------------------------*/

	socket.on('taitiSubmitClient', function(data) {
		var msg;
		var gameInstanceIndex = findGameInstance(data.pinNo);

		//check if passvote is true or false
		if(data.passVote) {
			//change passVote status
			gameInstances[gameInstanceIndex].player.list[data.player_index].passVote = 0;

			//increment to next person's turn
			gameInstances[gameInstanceIndex].whoseTurn = (gameInstances[gameInstanceIndex].whoseTurn + 1)%gameInstances[gameInstanceIndex].num_players;

			//generate message
			msg = "Player " + (data.whoseTurn + 1) + " has passed his/her turn!";
		}

		else {
			//remove cards from player's hand and add to discard pile
			for(var i=0;i<data.selected_cards.length;i++) {
				gameInstances[gameInstanceIndex].Discard_pile.push(data.selected_cards[i]);
				for(var j=0;j<gameInstances[gameInstanceIndex].player.list[data.player_index].hand.length;j++) {
					if(JSON.stringify(data.selected_cards[i]) == JSON.stringify(gameInstances[gameInstanceIndex].player.list[data.player_index].hand[j])) {
						gameInstances[gameInstanceIndex].player.list[data.player_index].hand.splice(j, 1);
					}
				}
			}

			//generate message
			msg = "Player " + (data.whoseTurn + 1) + " has made his/her move!";

			//change value of cards left in player's hand
			gameInstances[gameInstanceIndex].scoreboard[data.whoseTurn].score = gameInstances[gameInstanceIndex].player.list[data.whoseTurn].hand.length;

			//change last played cards, and change to next player's turn
			gameInstances[gameInstanceIndex].last_played_cards = data.selected_cards;
			gameInstances[gameInstanceIndex].whoseTurn = (gameInstances[gameInstanceIndex].whoseTurn + 1)%gameInstances[gameInstanceIndex].num_players;
			gameInstances[gameInstanceIndex].lastPersonPlayed = data.player_index;
		}

		//if everyone has passed and it has reached back to the player who last placed something down,
		//reset last_played_cards to an empty array
		if(gameInstances[gameInstanceIndex].lastPersonPlayed === gameInstances[gameInstanceIndex].whoseTurn) {
			gameInstances[gameInstanceIndex].last_played_cards = [];
			msg = "Everybody has passed! Player " + (gameInstances[gameInstanceIndex].whoseTurn + 1) + " starts the round";
		}
		io.sockets.in(data.pinNo).emit('taitiSubmitServer', gameInstances[gameInstanceIndex], msg);

		var winner_found = false;
		//Check if there's any winners (empty hands) past this stage
		for(i=0;i<gameInstances[gameInstanceIndex].player.list.length;i++) {
			if(gameInstances[gameInstanceIndex].player.list[i].hand.length == 0) {
				winner_found = true;
				break;
			}
		}
		if(winner_found) {
			io.sockets.in(data.pinNo).emit('taitiWinnerFound', i);
		}
	});


/*-----------------------
|						 |
|						 |
|'Hearts' functions here |
|						 |
|						 |
------------------------*/
	socket.on('PassCards', function(data) {
		var gameInstanceIndex = findGameInstance(data.pinNo);
		var counter = 0;
		var waitplayers = [];
		var dir = "";

		gameInstances[gameInstanceIndex].player.list[data.player_index].passVote = 1;
		gameInstances[gameInstanceIndex].player.list[data.player_index].hand = handremove(gameInstances[gameInstanceIndex].player.list[data.player_index].hand,data.selected_cards);
		//Passing the Cards
		if(data.passwhere === 1){
			dir = "left";
			gameInstances[gameInstanceIndex].player.list[(data.player_index+1)%4].hand = gameInstances[gameInstanceIndex].player.list[(data.player_index+1)%4].hand.concat(data.selected_cards);
		}
		//Pass right
		else if(data.passwhere === 2){
			dir = "right";
			let index = data.player_index-1;
			if(index < 0){
				index += 4;
			}
			gameInstances[gameInstanceIndex].player.list[(index)%4].hand = gameInstances[gameInstanceIndex].player.list[(index)%4].hand.concat(data.selected_cards);
		}
		//Pass opposite
		else if(data.passwhere === 3){
			dir = "opposite";
			gameInstances[gameInstanceIndex].player.list[(data.player_index+2)%4].hand = gameInstances[gameInstanceIndex].player.list[(data.player_index+2)%4].hand.concat(data.selected_cards);

		}
		//Checks if all the players have chosen the three cards to pass
		for(let i=0;i<gameInstances[gameInstanceIndex].num_players;i++) {
			if(gameInstances[gameInstanceIndex].player.list[i].passVote === -1) {
				counter++;
				waitplayers.push(gameInstances[gameInstanceIndex].player.list[i].name + ' ');
			}
		}
		//Everybody has chosen their cards;
		if(counter === 0){
			for(let i=0;i<gameInstances[gameInstanceIndex].num_players;i++){
				let index = gameInstances[gameInstanceIndex].player.list[i].hand.findIndex(d => d.name === "2 of Clubs");
				if(index != -1){
					var turn = i;
					break;
				}
			}
			gameInstances[gameInstanceIndex].player.resetPassVotes();
			io.sockets.in(data.pinNo).emit('PassedCards',{
				gameinstance: gameInstances[gameInstanceIndex],
				msg: "Everybody has passed their cards! Waiting for Player " + (turn+1) + " to start the game with 2 of Clubs...",
				whoseTurn : turn,
			})
			return;
		}
		//Not everybody has selected their cards. Prints out waiting message...
		else{
			var msg = "Waiting on player(s):" + waitplayers.join() + "to choose their 3 cards to pass " + dir + "..."
			io.sockets.in(data.pinNo).emit('HeartsWaitPassCards', msg);
		}
	});
	socket.on('PlayCard', function(data) {
		var gameInstanceIndex = findGameInstance(data.pinNo);
		var counter = 0;
		var whoseTurn = (data.whoseTurn + 1)%4;
		var playedcards = data.played_cards;
		var msg = "";

		if(playedcards.length === 4){
			playedcards = [];
		}
		playedcards.push({card:data.played_card, player_index:(data.player_index)});

		//Checks if starting a trick
		if(playedcards.length === 1){
			msg = "Player " + (data.player_index+1) + " starts the trick with " + data.played_card.name + "! Waiting for Player " + (whoseTurn+1) + "...";
			io.sockets.in(data.pinNo).emit('StartTrick', {
				message: msg,
				whoseTurn: whoseTurn,
				played_suit: data.played_card.suit,
				played_cards: playedcards,
				break_hearts: data.break_hearts,
			});
			return;
		}

		//Checks if all the players have played a card
		else if(playedcards.length === 4){
			var winningplayer = -1,max = -1, points = 0,card_index = -1;
			for(let j = 0; j<4;j++){
				if(playedcards[j].card.suit === data.played_suit && playedcards[j].card.value.num > max){
					max = playedcards[j].card.value.num;
					winningplayer = playedcards[j].player_index;
					card_index = j;
				}
				points += HeartsValue(playedcards[j].card);
			}
			gameInstances[gameInstanceIndex].scoreboard[winningplayer].rdscore += points;
			var scoreboard = gameInstances[gameInstanceIndex].scoreboard;
			// Checks if the game has ended
			if(data.num_tricks === 13){
				var gameEnd = 0,ShotMoon = -99,leastscore = 999, leastplayer = -1,firstplace = [];
				//Check if anyone has shot the moon
				for(let i = 0;i<4;i++){
					if(gameInstances[gameInstanceIndex].scoreboard[i].rdscore === 26){
						ShotMoon = i;
					}
				}
				//A player has shot the moon
				if(ShotMoon >= 0){
					for(let i = 0;i<4;i++){
						if(i === ShotMoon){
							gameInstances[gameInstanceIndex].scoreboard[i].rdscore = 0;
							continue;
						}
						gameInstances[gameInstanceIndex].scoreboard[i].score += 26;
					}
				}
				else{
					for(let i = 0;i<4;i++){
							gameInstances[gameInstanceIndex].scoreboard[i].score += gameInstances[gameInstanceIndex].scoreboard[i].rdscore;
							gameInstances[gameInstanceIndex].scoreboard[i].rdscore = 0;
					}
				}
				//Update scoreboard
				scoreboard = gameInstances[gameInstanceIndex].scoreboard;

				//Check if anyone's score is over 100 aka gameEnd
				for(let i = 0;i<4;i++){
					if(gameInstances[gameInstanceIndex].scoreboard[i].score < leastscore){
						leastplayer = i;
						leastscore = gameInstances[gameInstanceIndex].scoreboard[i].score
					}
					if(gameInstances[gameInstanceIndex].scoreboard[i].score >= 100){
						gameEnd = 1;
					}
				}

				//Check for ties
				for(let i = 0;i<4;i++){
					if(gameInstances[gameInstanceIndex].scoreboard[i].score === leastscore){
						firstplace.push(leastscore);
					}
				}
				if(gameEnd && firstplace.length === 1){
					msg = HeartsShootMoon(ShotMoon) + "Game has ended! Player " + (leastplayer+1) + " has won the game! Thanks for playing!"
					io.sockets.in(data.pinNo).emit('gameEnd', {
						message: msg,
						scoreboard: scoreboard,
						played_cards: playedcards,
					});
				}
				else{
					msg = HeartsShootMoon(ShotMoon) + "Round " + (data.num_game) + " has ended! Player " + (winningplayer +1) + " won the last trick!";
					io.sockets.in(data.pinNo).emit('NextRound', {
						message: msg,
						whoseTurn: winningplayer,
						scoreboard: scoreboard,
						played_cards: playedcards,
					});
				}
				return;
			}
			else{
				msg = "Player " + (winningplayer +1) + " wins the trick with " + playedcards[card_index].card.name + "! It's his turn now..."
				io.sockets.in(data.pinNo).emit('NextTrick', {
					message: msg,
					whoseTurn: winningplayer,
					scoreboard: scoreboard,
					played_cards: playedcards,
					break_hearts: data.break_hearts,
					num_tricks: data.num_tricks + 1,
				});
			}
			return;
		}
		else{
			msg = "Player " + (data.player_index+1) + " played " + data.played_card.name + ". " + "Waiting for Player " + (whoseTurn+1) + "...";
			io.sockets.in(data.pinNo).emit('NextTurn', {
				played_cards: playedcards,
				message: msg,
				whoseTurn: whoseTurn,
				played_suit: data.played_suit,
				break_hearts: data.break_hearts
			});
			return;
		}
	})
	socket.on("VoteNextGame",function(data){
		var gameInstanceIndex = findGameInstance(data.pinNo);
		var counter = 0;
		var waitplayers = [];
		var msg;
		gameInstances[gameInstanceIndex].player.list[data.player_index].passVote = 1;

		//Checks if all the players have chosen move on to the next game
		for(let i=0;i<gameInstances[gameInstanceIndex].num_players;i++) {
			if(gameInstances[gameInstanceIndex].player.list[i].passVote === -1) {
				counter++;
				waitplayers.push(gameInstances[gameInstanceIndex].player.list[i].name + ' ');
			}
		}
		//Everybody voted next game
		if(counter === 0){
			// initialising the deck
			gameInstances[gameInstanceIndex].deck.shuffle();

			// dealing out the cards
			while(gameInstances[gameInstanceIndex].deck.size() != 0) {
				let card = gameInstances[gameInstanceIndex].deck.deal();
				gameInstances[gameInstanceIndex].player.list[(gameInstances[gameInstanceIndex].deck.size() + 1)%gameInstances[gameInstanceIndex].num_players].hand.push(card);
			}
			gameInstances[gameInstanceIndex].player.resetPassVotes();
			//If the next round is a no pass round...
			if(!((data.num_game+ 1)%4)){
				for(let i=0;i<gameInstances[gameInstanceIndex].num_players;i++){
					let index = gameInstances[gameInstanceIndex].player.list[i].hand.findIndex(d => d.name === "2 of Clubs");
					if(index != -1){
						var turn = i;
						break;
					}
				}
				io.sockets.in(data.pinNo).emit('StartNextGame',{
					gameinstance: gameInstances[gameInstanceIndex],
					num_game : data.num_game + 1,
					whoseTurn: turn,
					num_tricks: 1,
					passed: 1,
				})
				return;
			}
			else{
				io.sockets.in(data.pinNo).emit('StartNextGame',{
					gameinstance: gameInstances[gameInstanceIndex],
					num_game : data.num_game + 1,
					whoseTurn: -1,
					num_tricks: -1,
					passed: 0,
				})
				return;
			}
		}
		//Not everybody has selected their cards. Prints out waiting message...
		else{
			msg = "Waiting on player(s):" + waitplayers.join() + "to vote next round..."
			io.sockets.in(data.pinNo).emit('HeartsWaitPassCards',msg);

		}
	});

	/*-----------------------
	|						 |
	|						 |
	|'Bridge' functions here |
	|						 |
	|						 |
	------------------------*/

	socket.on('Bid',function(data){
		var gameInstanceIndex = findGameInstance(data.pinNo);
		var whoseTurn = (data.player_index + 1)%4;

		//Reset pass votes because a player has bid
		gameInstances[gameInstanceIndex].player.resetPassVotes();

		io.sockets.in(data.pinNo).emit('BidUpdate',
			{
				player_index: data.player_index,
				trump: data.trump,
				difficulty: data.difficulty,
				whoseTurn: whoseTurn,
			}
		);
		return;
	});
	socket.on('Pass',function(data){
		var gameInstanceIndex = findGameInstance(data.pinNo);
		var whoseTurn = (data.player_index + 1)%4;
		var counter = 0;
		var winningplayer = -1;
		gameInstances[gameInstanceIndex].player.list[data.player_index].passVote = 1;

		//Check who has passed
		for(let i=0;i<gameInstances[gameInstanceIndex].num_players;i++) {
			if(gameInstances[gameInstanceIndex].player.list[i].passVote === 1) {
				counter++;
			}
			else{
				winningplayer = i;
			}
		}

		//Current bid has won
		if(counter === 3){
			io.sockets.in(data.pinNo).emit('BidWon',
				{
					player_index: data.player_index,
					winning_player: winningplayer,
				});
				return;
		}
		else{
			io.sockets.in(data.pinNo).emit('PassUpdate',
				{
					player_index: data.player_index,
					whoseTurn: whoseTurn,
				});
			return;
		}
	});
	socket.on('BridgePlayCard', function(data) {
		var gameInstanceIndex = findGameInstance(data.pinNo);
		var counter = 0;
		var whoseTurn = (data.whoseTurn + 1)%4;
		var playedcards = data.played_cards;
		var msg = "";

		if(playedcards.length === 4){
			playedcards = [];
		}
		playedcards.push({card:data.played_card, player_index:(data.player_index)});
		//Checks if starting a trick
		if(playedcards.length === 1){
			msg = "Player " + (data.player_index+1) + " starts the trick with " + data.played_card.name + "! Waiting for Player " + (whoseTurn+1) + "...";
			io.sockets.in(data.pinNo).emit('BridgeStartTrick', {
				message: msg,
				whoseTurn: whoseTurn,
				played_suit: data.played_card.suit,
				played_cards: playedcards,
				break_trump: data.break_trump,
			});
			return;
		}

		//Checks if all the players have played a card
		else if(playedcards.length === 4){
			var winningplayer = -1,max = -1, points = 0,card_index = -1,winningsuit = "",winningset = data.difficulty +7-1
			for(let j = 0; j<4;j++){

				//Checks whether player played a trump suit
				if(playedcards[j].card.suit === data.trump_suit){
					if(winningsuit !== data.trump_suit){
						winningsuit = playedcards[j].card.suit;
						max = playedcards[j].card.value.num;
						winningplayer = playedcards[j].player_index;
						card_index = j;
						continue;
					}
					else if(playedcards[j].card.value.num > max){
						winningsuit = playedcards[j].card.suit;
						max = playedcards[j].card.value.num;
						winningplayer = playedcards[j].player_index;
						card_index = j;
						continue;
					}
				}
				//If winning suit is trump_suit, then the below code doesn't matter because only trump suits can win this trick
				if(winningsuit !== data.trump_suit && playedcards[j].card.suit === data.played_suit && playedcards[j].card.value.num > max){
					winningsuit = playedcards[j].card.suit;
					max = playedcards[j].card.value.num;
					winningplayer = playedcards[j].player_index;
					card_index = j;
				}
			}
			gameInstances[gameInstanceIndex].scoreboard[winningplayer].score++;
			var scoreboard = gameInstances[gameInstanceIndex].scoreboard;

			//Need determine indexes of losing bidders...
			var losingbidders = [];
			for(let i = 0;i<4;i++){
				if(i !== data.winbid_player && i !== data.partner_index){
					losingbidders.push(i);
				}
			}
			//Check if game has ended
			if((gameInstances[gameInstanceIndex].scoreboard[data.winbid_player].score + gameInstances[gameInstanceIndex].scoreboard[data.partner_index].score) === winningset){
				msg = "The bid winners Players " + (data.winbid_player+1) + " & " + (data.partner_index+1) + " has won the game! Thanks for playing!"
				io.sockets.in(data.pinNo).emit('BridgeEnd', {
					message: msg,
					scoreboard: scoreboard,
					played_cards: playedcards,
					break_trump: data.break_trump,
					num_tricks: data.num_tricks + 1,
				});
				return;
			}
			else if(((gameInstances[gameInstanceIndex].scoreboard[losingbidders[0]].score + gameInstances[gameInstanceIndex].scoreboard[losingbidders[1]].score)) === (14-winningset)){
				msg = "The bid losers Players " + (losingbidders[0]+1) + " & " + (losingbidders[1]+1) + " has won the game! Thanks for playing!"
				io.sockets.in(data.pinNo).emit('BridgeEnd', {
					message: msg,
					scoreboard: scoreboard,
					played_cards: playedcards,
					break_trump: data.break_trump,
					num_tricks: data.num_tricks + 1,
				});

			}
			else{
				msg = "Player " + (winningplayer +1) + " wins the trick with " + playedcards[card_index].card.name + "! It's his turn now..."
				io.sockets.in(data.pinNo).emit('BridgeNextTrick', {
					message: msg,
					whoseTurn: winningplayer,
					scoreboard: scoreboard,
					played_cards: playedcards,
					break_trump: data.break_trump,
					num_tricks: data.num_tricks + 1,
				});
			}
			return;
		}
		else{
			msg = "Player " + (data.player_index+1) + " played " + data.played_card.name + ". " + "Waiting for Player " + (whoseTurn+1) + "...";
			io.sockets.in(data.pinNo).emit('BridgeNextTurn', {
				played_cards: playedcards,
				message: msg,
				whoseTurn: whoseTurn,
				played_suit: data.played_suit,
				break_trump: data.break_trump,
			});
			return;
		}
	});
	socket.on('ChoosePartner', function(data) {
		var gameInstanceIndex = findGameInstance(data.pinNo);
		var partnerindex = -1;

		//Check who is the partner
		for(let i=0;i<gameInstances[gameInstanceIndex].num_players;i++){
			let index = gameInstances[gameInstanceIndex].player.list[i].hand.findIndex(d => d.name === data.card_name);
			if(index !== -1){
				partnerindex = i;
				break;
			}
		}

		io.sockets.in(data.pinNo).emit('PartnerChosen',{
			partner_index: partnerindex,
			player_index: data.player_index,
			card_name: data.card_name,
		})
	});
});

/* TODO:
- remove players from arrays (instance and gamepinlist) upon disconnection
*/
