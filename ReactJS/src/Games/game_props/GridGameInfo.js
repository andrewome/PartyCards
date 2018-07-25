import React, { Component } from 'react';
import '../../stylesheet/grid.css';

class GameInfo extends Component {
	render() {
		return (
			<div className = "Gridscoreboard">
				<p>Room PIN: <h1>{this.props.server_PIN}</h1></p>
				<p>Game being played: {this.props.GameName}</p>
				<p>Number of players connected: {this.props.current_players}/{this.props.num_players}</p>
			</div>
		);
	}
}

export default GameInfo;
