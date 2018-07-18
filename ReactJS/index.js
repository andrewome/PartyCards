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
			hand.splice(index,1);
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
			scoreboard: [],
			whoseTurn: whoseTurn,
			pinNo: data.pinNo,
			gametype: data.gameType,
			num_players: data.num_players,
			deck: new Deck(),
			player: new player(data.num_players),
			Discard_pile: [],
			declared_cards: {},
			last_played_cards: [],
			turn_phase: 0,
			lastPersonPlayed: -1,
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
			var isFull = false, i, j;

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

					// initialising scoreboard
					for(let i = 0;i<gameInstances[gameInstancesIndex].num_players;i++){
						gameInstances[gameInstancesIndex].scoreboard.push({name:gameInstances[gameInstancesIndex].player.list[i].name, score: gameInstances[gameInstancesIndex].player.list[i].score})
					}

					// initialising the deck
					gameInstances[gameInstancesIndex].deck.generate_deck();
					gameInstances[gameInstancesIndex].deck.shuffle();

					// dealing out the cards
					while(gameInstances[gameInstancesIndex].deck.size() != 0) {
						let card = gameInstances[gameInstancesIndex].deck.deal();
						gameInstances[gameInstancesIndex].player.list[(gameInstances[gameInstancesIndex].deck.size() + 1)%gameInstances[gameInstancesIndex].num_players].hand.push(card);
					}
					gameInstances[gameInstancesIndex].player.resetPassVotes();
					
					//if game is taiti, whoseturn should go to whoever who has 3 of diamonds
					if(gameInstances[gameInstancesIndex].gametype.valueOf() === "Taiti".valueOf()) {
						for(i=0;i<gameInstances[gameInstancesIndex].num_players;i++) {
							for(j=0;j<gameInstances[gameInstancesIndex].player.list[i].hand.length;j++) {
								if(gameInstances[gameInstancesIndex].player.list[i].hand[j].name.valueOf() === "3 of Diamonds".valueOf()) {
									gameInstances[gameInstancesIndex].whoseTurn = i;
									break;
								}
							}
						}
					}
					
					//if game is cheat/taiti, the scores are the number of cards in ones hand
					if(gameInstances[gameInstancesIndex].gametype.valueOf() === "Taiti".valueOf() || gameInstances[gameInstancesIndex].gametype.valueOf() === "Cheat".valueOf()) {
						for(i=0;i<gameInstances[gameInstancesIndex].num_players;i++) {
							gameInstances[gameInstancesIndex].scoreboard[i].score = gameInstances[gameInstancesIndex].player.list[i].hand.length;
						}
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
				gameInstances[gameInstanceIndex].scoreboard[data.player_index].score = gameInstances[gameInstanceIndex].player.list[data.player_index].hand.length;
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
				//console.log(gameInstances[gameInstanceIndex]);
			}
			else {
				io.sockets.in(data.pinNo).emit('cheatSubmitServerPhase1', gameInstances[gameInstanceIndex], msgNotCheated);
				//console.log(gameInstances[gameInstanceIndex]);
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
			gameInstances[gameInstanceIndex].scoreboard[winningplayer].score += points;
			// Checks if the game has ended
			if(data.num_tricks === 13){
				/*var gameEnd = 0,ShotMoon = 0,leastscore = 999, leastplayer = -1;
				//Check if anyone has won the game (i.e) points > 100
				for(let i = 0;i<4;i++){
					//Check who is in first place then need check draw
					if(gameInstances[gameInstanceIndex].scoreboard[i].score < leastscore){
						leastscore = gameInstances[gameInstanceIndex].scoreboard[i].score;
					}
					if(gameInstances[gameInstanceIndex].scoreboard[i].score >= 100){
						gameEnd = 0;
					}
				}*/
				msg = "Round " + (data.num_game) + " has ended! Player " + (winningplayer +1) + " won the last trick!";
				io.sockets.in(data.pinNo).emit('NextRound', {
					message: msg,
					whoseTurn: winningplayer,
					scoreboard: scoreboard,
					played_cards: playedcards,
				});
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
				})
				return;
			}
			else{
				io.sockets.in(data.pinNo).emit('StartNextGame',{
					gameinstance: gameInstances[gameInstanceIndex],
					num_game : data.num_game + 1,
					whoseTurn: -1,
					num_tricks: -1,
				})
				return;
			}
		}
		//Not everybody has selected their cards. Prints out waiting message...
		else{
			msg = "Waiting on player(s):" + waitplayers.join() + "to vote next round..."
			io.sockets.in(data.pinNo).emit('HeartsWaitPassCards', msg);
			return;
		}
	});
});

/* TODO:
- remove players from arrays (instance and gamepinlist) upon disconnection
*/
