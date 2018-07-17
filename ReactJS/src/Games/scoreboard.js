import React, { Component } from 'react';
import './Games.css';

class Scoreboard extends Component {
	render() {
		const Scores = this.props.scoreboard;
		const ListScores = Scores.map((d) =><p>{d.name} score: {d.score}</p>)
		//const listItems = data.map((d) => <li key={d.name}>{d.name} Score: {d.score}</li>);
		if(ListScores.length){
			return (
				<div className = "Scoreboard">
					{ListScores}
				</div>
			);
		}
		else {
			return(
				<div></div>
			);
		}
	}
}

export default Scoreboard;
