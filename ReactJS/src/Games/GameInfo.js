import React, { Component } from 'react';
import './Games.css';

class GameInfo extends Component {
	render() {
		return (
			<div className = "Scoreboard">
			<div style = {{display: 'inline-block',}}>
				<p>Player: {this.props.player_index + 1}</p>
				<p>Room PIN: {this.props.server_PIN}</p>
				<p>Game being played: {this.props.GameName}</p>
				<p>Waiting on: Player {this.props.whoseTurn + 1}</p>
			</div>
			<div style = {{display: 'inline-block',}}>
			</div>
			</div>
		);
	}
}

export default GameInfo;
