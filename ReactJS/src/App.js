import React, { Component } from 'react';
import './stylesheet/styles.css';
import Svrcreate from './svrcreate';
import JoinServer from './joinserver';
import Title from './title';
import Init from './Init';
import Cheat from './Games/Cheat';
import Hearts from './Games/Hearts';
import Taiti from './Games/Taiti';
import Bridge from './Games/Bridge';
import io from 'socket.io-client';

class Body extends Component {
	constructor(props) {
		super(props);

		// Make client connection to server
		// Don't forget to change localhost to your actual URL!
		this.socket = io("localhost:1521");

		this.state = {
			current_players: 0,
			server_PIN: "",
			create_server: false,
			join_server: false,
			server_created: false,
			Game: "N/A",
		}

		this.socket.on('numPlayers', function(value) {
			this.setState({current_players: value});
		}.bind(this));

		this.handlecreate_server = (value) => {
			this.setState({create_server: value});
		}
		this.handlejoin_server = (value) => {
			this.setState({join_server: value});
		}
		this.handlegame_type = (value) => {
			this.setState({Game: value})
		}
		this.handleserver_created = (value) => {
			this.setState({server_created: value});
		}
		this.handleselectGame = (value) => {
			this.setState({Game: value});
		}
		this.handlenum_players = (value) => {
			this.setState({num_players: value});
		}

		// gets game pin value from Init phase
		this.handleGetPin = (value) => {
			this.setState({server_PIN: value});
		}
	}

	render() {

		// if create_server & join_server is false, show the main page
		if(!this.state.create_server && !this.state.join_server) {
			return (
				<div>
					<Title />
					<Init
						OnHandle_create_server = {this.handlecreate_server}
						OnHandle_join_server = {this.handlejoin_server}
					  OnHandleGetPin = {this.handleGetPin}
						socket = {this.socket}
					/>
				</div>
			);
		}

		// if create_server is true and server_created is true, display game page
		else if(this.state.create_server && this.state.server_created) {
			if(this.state.Game === "Cheat"){
				return (
					<div className = "Game">
						<Cheat
							GameName = {this.state.Game}
							num_players = {this.state.num_players}
							server_PIN = {this.state.server_PIN}
							socket = {this.socket}
							current_players = {this.state.current_players}
						/>
					</div>
				);
			}
			else if(this.state.Game === "Taiti") {
				return (
					<div className = "Game">
						<Taiti
							GameName = {this.state.Game}
							num_players = {this.state.num_players}
							server_PIN = {this.state.server_PIN}
							socket = {this.socket}
							current_players = {this.state.current_players}
						/>
					</div>
				);
			}
			else if(this.state.Game === "Hearts") {
				return (
					<div className = "Game">
						<Hearts
							GameName = {this.state.Game}
							num_players = {this.state.num_players}
							server_PIN = {this.state.server_PIN}
							socket = {this.socket}
							current_players = {this.state.current_players}
						/>
					</div>
				);
			}
			else if(this.state.Game == "Bridge") {
				return(
					<div className = "Game">
						<Bridge
							GameName = {this.state.Game}
							num_players = {this.state.num_players}
							server_PIN = {this.state.server_PIN}
							socket = {this.socket}
							current_players = {this.state.current_players}
						/>
					</div>
				);
			}
			else {
				return(
					<div className = "App">
						Work in progress... Sorry!
					</div>
				);
			}
		}
		
		// if create create_server is false and server_created is false, show server creation page
		else if(this.state.create_server && !this.state.server_created ){
			return(
				<div>
					<Title />
						<Svrcreate
							OnHandle_server_created = {this.handleserver_created}
							OnHandle_selectGame = {this.handleselectGame}
							OnHandle_num_players = {this.handlenum_players}
							server_PIN = {this.state.server_PIN}
							socket = {this.socket}
						/>
				</div>
			)
		}
		// if join_server is true, show initialisation page
		else if(this.state.join_server) {
			return (
				<div className="Init">
					<Title/>
						<JoinServer
							socket = {this.socket}
							server_PIN = {this.state.server_PIN}
							OnHandleGetPin = {this.handleGetPin}
							OnHandle_server_created = {this.handleserver_created}
							OnHandle_create_server = {this.handlecreate_server}
							OnHandle_GameType = {this.handlegame_type}
							OnHandle_num_players = {this.handlenum_players}
							OnHandle_PinNo = {this.handleGetPin}
						/>
				</div>
			);
		}
	}
}
export default Body;
