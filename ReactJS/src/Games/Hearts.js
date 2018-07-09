import React, {Component} from 'react';
import Sort from './sorting';
import Scoreboard from './scoreboard';
import './Games.css';

function importAll(r) {
  let images = {};
  r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
  return images;
}

const images = importAll(require.context('./card_images', false, /\.(png|jpe?g|svg)$/));

class Hearts extends Component{
  constructor(props){
    super(props);
    this.state = {
      numgame: 0,
      whoseTurn: -1,
      game_phase: "", //0: select phase, 1: cheat phase
      server_PIN: this.props.server_PIN,
      last_action_tb: "Cheat!",
      message: "Waiting for players...",
      selected_cards: [],
      value: 1,
      num: 2,
      declared_cards: {num: -1, val: -1},
      Discard_pile: [],
      playerID: -1,
      player_hand: [],
      player_index: -1,
    }
    this.props.socket.on('startGame', function(data) {
			var msg = ('The last man has joined! Choose 3 cards to pass to your left!');
			this.setState({message: msg});
			//finding player index
			for(var i=0;i<data.player.list.length;i++) {
				if(data.player.list[i].id === this.props.socket.id) {
					break;
				}
			}
			//console.log(data.pinNo)
			this.setState ({
        game_phase: "pass",
        numgame: 1,
				server_PIN: data.pinNo,
				whoseTurn: parseInt(data.whoseTurn),
				player_hand: data.player.list[i].hand,
				player_index: parseInt(i),
				playerID: data.player.list[i].ID
			});
      if(this.state.player_hand.findIndex(x => x.name === "2 of Clubs") != -1 ){
        this.setState({turn_phase: 1})
      }
		}.bind(this));
  }
  render(){
    var playerhand = this.state.player_hand
		//Sorts hand according to value
		playerhand = Sort.bySuit(playerhand);
		var selectedcards = this.state.selected_cards;

		const listHand = playerhand.map((d) =>
			<img className = "cards" src = {images[d.value.sym + d.suit[0] + '.png']}
				onClick = {() =>{
        let index = playerhand.findIndex(x => x.name === d.name);
        if(this.state.game_phase === "pass"){
          if(selectedcards.length === 3){
            this.setState({message: "Cannot pass more than 3 cards!"});
            return;
          }
          else{
            playerhand.splice(index, 1);
            selectedcards.push(d)
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
        <Scoreboard
          server_PIN = {this.state.server_PIN} GameName = "Hearts"
          num_players = {this.props.num_players} whoseTurn = {this.state.whoseTurn}
          player_index = {this.state.player_index}
        />
        <p>Your hand:</p>
				<div className = "hand">
					{listHand}
				</div>
        <p>Selected Card: </p>
        {listCards}
        <div className = "statusbox">
					<p>{this.state.message}</p>
				</div>
      </div>
    );
  }
}

export default Hearts;
