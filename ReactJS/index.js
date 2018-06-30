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

// All backend functions here
io.on('connection', function(socket) {
	// When connected, output message onto server side console, add to list of connected clients
	console.log(socket.id + " has made socket connection to server");
	connected_ids.push(socket.id);
	printConnectedIDs();

	// When disconnected, output message to server side console, and remove from list of connected clients
	socket.on('disconnect', function() {
		console.log(socket.id + " has disconnected from the server");
		delete_id(socket.id);
		printConnectedIDs();
	});
	
	// Receive game pin + check if gamepin is being used
	socket.on('startNewServer', function(data) {
		var pinNo = data.pinNo, gametype = data.gametype, num_players = data.num_players, isTaken = false;
		
		// check if game PIN exists inside
		for(var i=0;i<game_instances.length;i++) {
			if(game_instances[i] == pinNo) {
				isTaken = true;
			}
		}
		
		// if it does, re-generate a new game PIN
		if(isTaken) {
			console.log("Server ID is taken, re-generating a new PIN");
			return isTaken;
		}
		// if it is unique, then add to list of game instances
		else {
			game_instances.push(pinNo);
			console.log(socket.id + " is using room " + data.pinNo);
		}
	});
});

