import React, { Component } from 'react';
import './Games.css';

class GameInfo extends Component {
	render() {
		return (
			<div className = "Scoreboard">
				<div style = {{display: 'inline-block',}}>
					<p>Room PIN: {this.props.server_PIN}</p>
					<p>Game being played: {this.props.GameName}</p>
					<p>Number of players connected: {this.props.current_players}/{this.props.num_players}</p>
				</div>
			</div>
		);
	}
}

export default GameInfo;
