import React, {Component} from 'react';
import Sort from './sorting';
import GameInfo from './GameInfo';
import Scoreboard from './scoreboard'
import './Games.css';

function importAll(r) {
  let images = {};
  r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
  return images;
}

const images = importAll(require.context('./card_images', false, /\.(png|jpe?g|svg)$/));

class Bridge extends Component{
  constructor(props){
    super(props);
    this.state = {
      num_players: this.props.num_players,
      num_game: 0,
      whoseTurn: -1,
      num_tricks: -2, // -1: passing phase, 0: 2 of clubs start  1 - 13 no. of tricks played
      server_PIN: this.props.server_PIN,
      message: "Waiting for players...",
      selected_cards: [],
      played_cards: [],
      playerID: -1,
      player_hand: [],
      player_index: -1,
      played_suit: "",
      break_hearts: 0,
      passed_cards: [],
      scoreboard: [],
      starting: 0,
      bidding: 0,
    }
    this.props.socket.on('startGame', function(data) {
			//finding player index
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id === this.props.socket.id) {
					break;
				}
			}
			this.setState ({
        num_players: this.props.num_players,
        num_tricks: 1, // passing phase
        num_game: 1,
				server_PIN: data.pinNo,
				player_hand: data.player.list[i].hand,
				player_index: parseInt(i),
				playerID: data.player.list[i].ID,
        scoreboard: data.scoreboard,
        whoseTurn: data.whoseTurn,
			});
      var msg = 'The last man has joined! Bidding Round begins... Player ' + (data.whoseTurn+1) + " will start the bid!";
      this.setState({message: msg});
		}.bind(this));
  }
  render(){
    var Suits = ["Clubs", "Diamonds", "Hearts", "Spades", "No Trump"];
    var Difficulty = [1,2,3,4,5,6,7];
    var playerhand = this.state.player_hand
		//Sorts hand according to value
		playerhand = Sort.bySuit(playerhand);
		var selectedcards = this.state.selected_cards;
    var playedcards = this.state.played_cards;
    const listPlayedCards = playedcards.map((d) => <img className = "scards" src ={images[d.card.value.sym + d.card.suit[0] + '.png']}/>);
    const listHand = playerhand.map((d) =>
			<img className = "cards" src = {images[d.value.sym + d.suit[0] + '.png']}
				onClick = {() =>{
        let index = playerhand.findIndex(x => x.name === d.name);
        if(this.state.whoseTurn === this.state.player_index){
          if(selectedcards.length === 1){
            this.setState({message: "You can only select 1 card to play"});
            return;
          }
          else{
            playerhand.splice(index, 1);
            selectedcards.push(d);
          }
        }
        this.setState({message: "You selected " + d.name});
				this.setState({player_hand: playerhand});
				this.setState({selected_cards: selectedcards});
				}}
			/>
		);
    const listCards = selectedcards.map((d) =>
			<img className = "scards" src ={images[d.value.sym + d.suit[0] + '.png']}
      onClick = {() => {
        let card = selectedcards.pop();
        playerhand.push(card);
        this.setState({message: "Pick a card!"});
        this.setState({player_hand: playerhand});
				this.setState({selected_cards: selectedcards});
      }}
			/>);
    return(
      <div className = "Parent">
        <GameInfo
    						server_PIN = {this.props.server_PIN}
    						GameName = {this.props.GameName}
    						num_players = {this.props.num_players}
    						current_players = {this.props.current_players}
    						whoseTurn = {this.state.whoseTurn}
    					/>
    		<Scoreboard
    						GameName = {this.props.GameName}
    						whoseTurn = {this.state.whoseTurn}
    						player_index = {this.state.player_index}
    						scoreboard = {this.state.scoreboard}
    					/>
        <p hidden = {this.state.player_hand.length === 0}>Your hand:</p>
				<div className = "hand">
					{listHand}
				</div>
        <p hidden = {this.state.selected_cards.length === 0}>Selected Card: </p>
        {listCards}
        <div hidden = {this.state.played_cards.length === 0} >
          <p>Played Cards: </p>
          {listPlayedCards}
        </div>
        <div>
          <button className = "button" hidden = {!this.state.bidding} onClick = {this.handlePlayCard}>Bid</button>
          <button className = "button" hidden = {this.state.bidding || (this.state.whoseTurn !== this.state.player_index || this.state.player_index === -1)} onClick = {this.handlePlayCard}>Play Card</button>
        </div>
        <div className = "statusbox">
					<p>{this.state.message}</p>
				</div>
      </div>
    );
  }
}

export default Bridge;
