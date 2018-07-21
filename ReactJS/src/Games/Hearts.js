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

class Hearts extends Component{
  constructor(props){
    super(props);
    this.state = {
      num_players: this.props.num_players,
      num_game: 0,
      whoseTurn: -1,
      num_tricks: -2, // -1: passing phase, 0: 2 of clubs start  1 - 13 no. of tricks played
      server_PIN: this.props.server_PIN,
      vote_next: 0,
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
      show_passed: 0,
      passed: 1,
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
        num_tricks: -1, // passing phase
        num_game: 1,
				server_PIN: data.pinNo,
				player_hand: data.player.list[i].hand,
				player_index: parseInt(i),
				playerID: data.player.list[i].ID,
        scoreboard: data.scoreboard,
        passed: 0,

			});
      var msg = 'The last man has joined! Choose 3 cards to pass to ' + this.PassWhere(this.state.num_game) + '!';
      this.setState({message: msg});
		}.bind(this));

    //PassingCards

    this.props.socket.on('HeartsWaitPassCards', function(msg) {
      //Update message informing players to wait
      this.setState({
        message: msg
      })
		}.bind(this));
    this.props.socket.on('PassedCards',function(data){
      let passedcards = [];
      for(let i = 12 ;i>=10;i--){
        passedcards.push(data.gameinstance.player.list[this.state.player_index].hand[i]);
      }
      this.setState({
        selected_cards : [],
        player_hand: data.gameinstance.player.list[this.state.player_index].hand,
        message: data.msg,
        num_tricks: 1,
        whoseTurn: data.whoseTurn,
        passed_cards: passedcards,
        show_passed : 1,
        starting: 1,
      })
    }.bind(this));

    //Playing Game

    this.props.socket.on('NextTurn',function(data){
      this.setState({
        message: data.message,
        whoseTurn: data.whoseTurn,
        played_cards: data.played_cards,
        selected_cards: [],
        break_hearts: data.break_hearts
      })
    }.bind(this));
    this.props.socket.on('StartTrick', function(data) {
      this.setState({
        message: data.message,
        whoseTurn: data.whoseTurn,
        played_suit: data.played_suit,
        played_cards: data.played_cards,
        selected_cards: [],
        break_hearts: data.break_hearts,
        show_passed: 0,
        starting: 0,
      })
		}.bind(this));
    this.props.socket.on('NextTrick', function(data) {
      this.setState({
        message: data.message,
        whoseTurn: data.whoseTurn,
        scoreboard: data.scoreboard,
        played_cards: data.played_cards,
        selected_cards:[],
        break_hearts: data.break_hearts,
        num_tricks: data.num_tricks,
      })
		}.bind(this));

    this.props.socket.on('NextRound', function(data) {
      this.setState({
        message: data.message,
        whoseTurn: -1,
        scoreboard: data.scoreboard,
        played_cards: data.played_cards,
        selected_cards:[],
        votenext: 1,
      })
		}.bind(this));
    this.props.socket.on('StartNextGame',function(data){
      var msg = "";
      if(!(data.num_game%4)){
        msg = "No pass round! Waiting for Player " + (data.whoseTurn+1) + " to start the game with 2 of Clubs..."
      }
      else{
        msg = "Game " + data.num_game + " is starting! " + "Choose 3 cards to pass to " + this.PassWhere(data.num_game) + '!'
      }

      this.setState ({
        num_tricks: data.num_tricks, // passing phase
        player_hand: data.gameinstance.player.list[this.state.player_index].hand,
        num_game: data.num_game,
        message: msg,
        whoseTurn: data.whoseTurn,
        votenext: 0,
        played_cards:[],
        starting: 1,
        passed: data.passed,
        break_hearts: 0,
      });

    }.bind(this));

    this.props.socket.on('gameEnd',function(data){
      this.setState({
        message: data.message,
        whoseTurn: -1,
        scoreboard: data.scoreboard,
        played_cards: data.played_cards,
      })
    }.bind(this));
    //when a player disconnects
		this.props.socket.on('playerDisconnected', function(msg) {
			this.setState({last_action_tb: msg});
		}.bind(this));
  }

  PassWhere = (numgame) =>{
    switch(numgame % 4){
      case 0:
      return -1;
      case 1:
      return "your left Player " + ((this.state.player_index + 1)%4 + 1);
      case 2:
      return "your right Player " + ((this.state.player_index + 3)%4 + 1);
      case 3:
      return "opposite Player " + ((this.state.player_index + 2)%4 + 1);
      default:
      return -1;
    }
  }
  handlePassCards = () =>{
    //If player did not select 3 cards notify player
    if(this.state.selected_cards.length < 3){
      this.setState({message: "You need to select 3 cards to pass"});
    }
    else if(this.state.selected_cards.length === 3){
      this.setState({passed: 1});
      this.props.socket.emit('PassCards', {
  			player_index: this.state.player_index,
  			pinNo: this.state.server_PIN,
        passwhere: this.state.num_game % this.state.num_players,
        selected_cards: this.state.selected_cards,
        player_hand : this.state.player_hand,
  		});
    }
}

  handlePlayCard = () =>{
    /*Preliminary checks*/
    var breakhearts = this.state.break_hearts;
    if(this.state.selected_cards.length < 1){
      this.setState({message: "You need to pick a card to play!"});
      return;
    }
    //Checks whether player has to play 2 of Clubs to start the game
    if(this.state.starting && this.state.selected_cards[0].name !== "2 of Clubs"){
      this.setState({message: "You need to play 2 of Clubs to start the game!"});
      return;
    }
    //No points on the first trick
    if(this.state.num_tricks === 1 && (this.state.selected_cards[0].suit === "Hearts" || this.state.selected_cards[0].name === "Q of Spades")){
      this.setState({message: "You cannot play Hearts or Queen of Spades on the first trick"});
      return;
    }
    /*Preliminary checks*/

    //Checks whether player is starting a trick
    if(!(this.state.played_cards.length%4)){
      //Hearts not broken but player played Hearts
      if(this.state.selected_cards[0].suit === "Hearts" && !this.state.break_hearts){
        //Check whether player hand has full hand of Hearts
        let index = this.state.player_hand.findIndex(x => x.suit === "Hearts");
        if (index !== -1){
          this.setState({message: "Hearts is not broken yet!"})
          return;
        }
        else{
          breakhearts = 1;
        }
      }
      this.setState({played_suit: this.state.selected_cards[0].suit })
      this.props.socket.emit("PlayCard", {
        played_card: this.state.selected_cards[0],
        whoseTurn: this.state.whoseTurn,
        played_suit: this.state.selected_cards[0].suit,
        player_index: this.state.player_index,
        pinNo: this.state.server_PIN,
        break_hearts: this.state.break_hearts,
        played_cards: this.state.played_cards,
        num_tricks: this.state.num_tricks,
        break_hearts: breakhearts,
        num_game: this.state.num_game,
      })
      return;
    }

    //Checks whether suit of card selected matches with suit being played
    if(this.state.selected_cards[0].suit !== this.state.played_suit){
      let index = this.state.player_hand.findIndex(x => x.suit === this.state.played_suit);
      if (index !== -1){
        this.setState({message: "You have to play " + this.state.played_suit + "!"})
        return;
      }
      else if(this.state.selected_cards[0].suit === "Hearts"){
        breakhearts = 1
      }
    }
    this.props.socket.emit("PlayCard", {
      played_card: this.state.selected_cards[0],
      whoseTurn: this.state.whoseTurn,
      played_suit: this.state.played_suit,
      player_index: this.state.player_index,
      pinNo: this.state.server_PIN,
      break_hearts: this.state.break_hearts,
      played_cards: this.state.played_cards,
      num_tricks: this.state.num_tricks,
      break_hearts: breakhearts,
      num_game: this.state.num_game,
    })
  }

  handleVoteNextGame = () =>{
    this.props.socket.emit("VoteNextGame",{
      player_index: this.state.player_index,
      pinNo: this.state.server_PIN,
      num_game: this.state.num_game,
    })
  }

  render(){
    var playerhand = this.state.player_hand
		//Sorts hand according to value
		playerhand = Sort.bySuit(playerhand);
		var selectedcards = this.state.selected_cards;
    var passedcards = this.state.passed_cards;
    var playedcards = this.state.played_cards;

		const listHand = playerhand.map((d) =>
			<img className = "cards" src = {images[d.value.sym + d.suit[0] + '.png']}
				onClick = {() =>{
        let index = playerhand.findIndex(x => x.name === d.name);
        if(this.state.num_tricks === -1){
          if(selectedcards.length === 3){
            this.setState({message: "Cannot pass more than 3 cards!"});
            return;
          }
          else{
            playerhand.splice(index, 1);
            selectedcards.push(d);
          }
        }
        else if(this.state.whoseTurn === this.state.player_index){
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
    const listPlayedCards = playedcards.map((d) => <img className = "scards" src ={images[d.card.value.sym + d.card.suit[0] + '.png']}/>);
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
    const listReceived = passedcards.map((d) =>
			<img className = "scards" src ={images[d.value.sym + d.suit[0] + '.png']}/>);

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
        <div hidden = {!this.state.show_passed} >
          <p> You received: </p>
          {listReceived}
        </div>
        <p hidden = {this.state.selected_cards.length === 0}>Selected Card: </p>
        {listCards}
        <div hidden = {this.state.played_cards.length === 0} >
          <p>Played Cards: </p>
          {listPlayedCards}
        </div>
        <div>
          <button className = "button" hidden = {this.state.passed}
          onClick = {this.handlePassCards}
          >Pass Cards</button>
          <button className = "button" hidden = {this.state.whoseTurn !== this.state.player_index || this.state.player_index === -1} onClick = {this.handlePlayCard}>Play Card</button>
          <button className = "button" hidden = {!this.state.votenext} onClick = {this.handleVoteNextGame}>Start next game!</button>
        </div>
        <div className = "statusbox">
					<p>{this.state.message}</p>
				</div>
      </div>
    );
  }
}

export default Hearts;
