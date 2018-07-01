var portNum = 1520;
var express = require('express');
var socket = require('socket.io');

// App setup
var app = express();
var server = app.listen(portNum, function() { 
	console.log('Server has been started. Port number = ' + portNum);
});

// Set up standard file
app.use(express.static('public'));

// Socket setup
io = socket(server);

// Server side variables
var connected_ids = [];
var game_instances = [];
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
		var instance = {pinNo: data.pinNo, gametype: data.gametype, num_players: data.num_players, current_players: 1};
		game_instances.push(instance);
		console.log(socket.id + " has created a new room: " + data.pinNo);
	});
	
	// authenticate user 
	socket.on('connectToRoom', function(pin) {
		var i, l = PINNumList.length, pinExists = false;
		for(i=0;i<l;i++) {
			if(PINNumList[i] == pin) {
				pinExists = true;
				break;
			}
		}
		
		if(pinExists) {
			socket.join(pin);
			console.log(socket.id + " has joined room " + pin);
		}
		else {
			socket.emit('AuthFailed');
		}
	});
		
});

/* TODO:
- remove players from array upon disconnection
- 
*/