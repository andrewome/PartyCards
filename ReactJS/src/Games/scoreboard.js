import React, { Component } from 'react';
import './Games.css';

class Scoreboard extends Component {
	render() {
		//const data = this.props.players.list
		//const listItems = data.map((d) => <li key={d.name}>{d.name} Score: {d.score}</li>);
		return (
			<div className = "Scoreboard">
				<p>Player: {this.props.player_index + 1}</p>
				<p>Room PIN: {this.props.server_PIN}</p>
				<p>Game being played: {this.props.GameName}</p>
				<p>Waiting on: Player {this.props.whoseTurn + 1}</p>
			</div>
		);
	}
}

export default Scoreboard;
