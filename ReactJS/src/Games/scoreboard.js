import React, { Component } from 'react';
import './Games.css';

class Scoreboard extends Component {
	render() {
		const Scores = this.props.scoreboard;
		var ListScores;
		if(this.props.GameName === "Hearts"){
			ListScores = Scores.map((d) => <p>{d.name} score: {d.score} ({d.rdscore})</p>);
		}
		else{
			ListScores = Scores.map((d) => <p>{d.name} score: {d.score}</p>);
		}
		const ListHand = Scores.map((d) => <p> {d.name} cards left: {d.score}</p>);
		//const listItems = data.map((d) => <li key={d.name}>{d.name} Score: {d.score}</li>);

		if(ListScores.length) {
			if(this.props.GameName === "Cheat" || this.props.GameName === "Taiti") {
				return (
					<div className = "Scoreboard">
						<h1>Player {this.props.player_index + 1}</h1>
						<p>Waiting on: Player {this.props.whoseTurn + 1}</p>
						{ListHand}
					</div>
				);
			}
			else {
				return (
					<div className = "Scoreboard">
						<h1>Player {this.props.player_index + 1}</h1>
						<p>Waiting on: Player {this.props.whoseTurn + 1}</p>
						{ListScores}
					</div>
				);
			}
		}
		else {
			return(
				<div></div>
			);
		}
	}
}

export default Scoreboard;
