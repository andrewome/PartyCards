import React, {Component} from 'react';
import Sort from './sorting';
import GameInfo from './GameInfo';
import Scoreboard from './scoreboard'
import '../stylesheet/styles.css';

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
      break_trump: 0,
      passed_cards: [],
      scoreboard: [],
      starting: 0,
      bidding: 0,
      choose_partner: 0,
      playing:0,
      winbid_player: "",
      winning_diff: 0,
      winning_trump: {value: '0', name: ""},
      difficulty: 1,
      trump: 0,
      partner_index: -1,
      partner_card: "",
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
        bidding: 1,
			});
      var msg = 'The last man has joined! Bidding Round begins... Player ' + (data.whoseTurn+1) + " will start the bid!";
      this.setState({message: msg});
		}.bind(this));
    this.props.socket.on('BidUpdate', function(data){
      var TrumpSuit = this.ValuetoTrump(data.trump)
      var msg = "Player " + (data.player_index + 1) + " bids " + data.difficulty + " " + TrumpSuit + "!" + " Player " + (data.whoseTurn+1) + "'s turn to bid...";
      this.setState({
        message: msg,
        whoseTurn: data.whoseTurn,
        winning_diff: parseInt(data.difficulty),
        winning_trump: {value: parseInt(data.trump), name: TrumpSuit},
        winbid_player:(data.player_index),
      })
    }.bind(this));

    this.props.socket.on('PassUpdate', function(data){
      var msg = "Player " + (data.player_index + 1) + " has passed!" + " Player " + (data.whoseTurn+1) + "'s turn to bid...";
      this.setState({
        message: msg,
        whoseTurn: data.whoseTurn,
      })
    }.bind(this));
    this.props.socket.on('BidWon', function(data){
      var msg = "Player " + (data.player_index + 1) + " has passed!" + " Player " + (data.winning_player+1) + " has won the bid and has to choose a partner!";
      this.setState({
        message: msg,
        whoseTurn: data.winning_player,
        choose_partner:1,
        bidding: 0,
        difficulty: 'A',
        trump: 0,
      })
    }.bind(this));
    this.props.socket.on('BridgeNextTurn',function(data){
      this.setState({
        message: data.message,
        whoseTurn: data.whoseTurn,
        played_cards: data.played_cards,
        selected_cards: [],
        break_trump: data.break_trump,
      })
    }.bind(this));
    this.props.socket.on('BridgeStartTrick', function(data) {
      this.setState({
        message: data.message,
        whoseTurn: data.whoseTurn,
        played_suit: data.played_suit,
        played_cards: data.played_cards,
        selected_cards: [],
        break_trump: data.break_trump,
        show_passed: 0,
        starting: 0,
      })
		}.bind(this));
    this.props.socket.on('BridgeNextTrick', function(data) {
      this.setState({
        message: data.message,
        whoseTurn: data.whoseTurn,
        scoreboard: data.scoreboard,
        played_cards: data.played_cards,
        selected_cards:[],
        break_trump: data.break_trump,
        num_tricks: data.num_tricks,
        played_suit: "",
      })
		}.bind(this));
    this.props.socket.on('PartnerChosen', function(data) {
      var turn = data.player_index, msg = "",breaktrump = 1;
      if(this.state.winning_trump.name !== "No Trump"){
        turn = (turn+1)%4;
        breaktrump = 0;
      }
      if(data.partner_index === this.state.player_index){
        msg = "Player " + (data.player_index+1) + " has chosen you("+ data.card_name + ") as your partner!" + " Player " + (turn+1) + " starts the game..."
      }
      else{
        msg = "Player " + (data.player_index+1) + " has chosen " + data.card_name + " as their partner! " + "Player " + (turn+1) + " starts the game..."
      }
      this.setState({
        message: msg,
        whoseTurn: turn,
        choose_partner: 0,
        playing:1,
        break_trump: breaktrump,
        partner_index: data.partner_index,
        partner_card: data.card_name,
      })
		}.bind(this));
    this.props.socket.on('BridgeEnd', function(data) {
      this.setState({
        message:data.message,
        whoseTurn: -1,
        playing:0,
        break_trump: data.break_trump,
        num_tricks : data.num_tricks,
        selected_cards:[],
        played_cards: data.played_cards,
        scoreboard: data.scoreboard,
      })
    }.bind(this));
  }

  DifftoSet = (val) =>{
    if(val > 0){
      return (val + 7 -1) + "-" + (14-7-val+1);
    }
    else{
      return "";
    }
  }
  ValuetoTrump = (val) =>{
    switch(parseInt(val)){
      case 0:
      return "Clubs";
      case 1:
      return "Diamonds";
      case 2:
      return "Hearts";
      case 3:
      return "Spades";
      case 4:
      return "No Trump";
      default:
      return "Invalid Trump value";
    }
  }
  handleDiffChange = (e) =>{
    this.setState({difficulty: e.target.value})
  }
  handleTrumpChange = (e) =>{
    this.setState({trump: e.target.value})
  }
  handlePass = () =>{
    this.props.socket.emit('Pass',{
      player_index: this.state.player_index,
      pinNo: this.state.server_PIN,
    })
  }
  handlebidding = ()=>{
    //Check whether player is bidding a lower difficulty than the current bid
    if(this.state.difficulty < this.state.winning_diff){
      this.setState({message: "Cannot bid a lower difficulty!"})
      return;
    }
    //Check whether player is bidding a lower ranked suit at the same difficulty
    //Not sure why cannot use === comparator here
    if(this.state.difficulty == this.state.winning_diff){
      if(this.state.trump <= this.state.winning_trump.value){
        this.setState({message:"You must bid a higher ranked suit!"});
        return;
      }
    }
    this.props.socket.emit('Bid',{
      player_index: this.state.player_index,
      trump: this.state.trump,
      difficulty: this.state.difficulty,
      pinNo:this.state.server_PIN,
    })
  }
  handlePlayCard = () =>{
    /*Preliminary checks*/
    var breaktrump = this.state.break_trump;
    if(this.state.selected_cards.length < 1){
      this.setState({message: "You need to pick a card to play!"});
      return;
    }
    /*Preliminary checks*/

    //Checks whether player is starting a trick
    if(!(this.state.played_cards.length%4)){
      //Trump not broken but player played Trump Suit
      if(this.state.selected_cards[0].suit === this.state.winning_trump.name && !this.state.break_trump){
        //Check whether player hand has full hand of Trump
        let index = this.state.player_hand.findIndex(x => x.suit === this.state.winning_trump.name);
        if (index !== -1){
          this.setState({message: this.state.winning_trump.name + " is not broken yet!"})
          return;
        }
        else{
          breaktrump = 1;
        }
      }
      this.setState({played_suit: this.state.selected_cards[0].suit })
    }
    //Checks whether suit of card selected matches with suit being played
    if(this.state.selected_cards[0].suit !== this.state.played_suit){
      let index = this.state.player_hand.findIndex(x => x.suit === this.state.played_suit);
      if (index !== -1){
        this.setState({message: "You have to play " + this.state.played_suit + "!"})
        return;
      }
      else if(this.state.selected_cards[0].suit === this.state.winning_trump.name){
        breaktrump = 1
      }
    }
    this.props.socket.emit("BridgePlayCard", {
      played_card: this.state.selected_cards[0],
      whoseTurn: this.state.whoseTurn,
      played_suit: this.state.selected_cards[0].suit,
      player_index: this.state.player_index,
      pinNo: this.state.server_PIN,
      played_cards: this.state.played_cards,
      num_tricks: this.state.num_tricks,
      break_trump: breaktrump,
      num_game: this.state.num_game,
      difficulty: this.state.winning_diff,
      partner_index: this.state.partner_index,
      trump_suit: this.state.winning_trump.name,
      winbid_player: this.state.winbid_player,
    })
  }

  handleChoosePartner = () => {
    var cardname = this.state.difficulty + " of " + this.ValuetoTrump(this.state.trump);
    //Check if player called himself as partner
    let index = this.state.player_hand.findIndex(d => d.name === cardname);
    if(index !== -1){
      this.setState({message: "You cannot call yourself as partner!"})
      return;
    }
    else{
      this.props.socket.emit('ChoosePartner',{
        card_name: cardname,
        player_index: this.state.player_index,
        pinNo:this.state.server_PIN,
      })
    }
  }

	render() {
		var Trumps = [{value: '0', name:"Clubs"}, {value: '1', name: "Diamonds"}, {value: '2', name:"Hearts"},{value: '3', name:"Spades" },{value: '4', name: "No Trump" }];
		var Suits = [{value: '0', name:"Clubs"}, {value: '1', name: "Diamonds"}, {value: '2', name:"Hearts"},{value: '3', name:"Spades" }]
		var Difficulty = [1,2,3,4,5,6,7];
		var values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
		var playerhand = this.state.player_hand
		var selectedcards = this.state.selected_cards;
		var playedcards = this.state.played_cards;

			//Sorts hand according to Suit
		playerhand = Sort.bySuit(playerhand);
		const listValues = values.map((d) => <option value = {d}> {d} </option>)
		const listDifficulty = Difficulty.map((d) => <option value = {d}> {d} </option>)
		const listTrumps = Trumps.map((d) => <option value = {d.value} > {d.name} </option>)
		const listSuits = Suits.map((d) => <option value = {d.value} > {d.name} </option>)
		const listPlayedCards = playedcards.map((d) => <img className = "scards" src ={images[d.card.value.sym + d.card.suit[0] + '.png']}/>);
		const listHand = playerhand.map((d) =>
			<img className = "cards" src = {images[d.value.sym + d.suit[0] + '.png']}
				onClick = {() =>{
					let index = playerhand.findIndex(x => x.name === d.name);
					if(this.state.bidding || this.state.choose_partner){
						return;
					}
					if(this.state.whoseTurn === this.state.player_index) {
						if(selectedcards.length === 1){
							this.setState({message: "You can only select 1 card to play"});
							return;
						}
						else {
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
			/>
		);
		
		return (
			<div className = "Game">
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
					winning_diff = {this.state.winning_diff}
					winning_trump = {this.state.winning_trump}
					winning_player = {this.state.winbid_player}
					sets = {this.DifftoSet(this.state.winning_diff)}
					partner_card = {this.state.partner_card}
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
				
				<div hidden = {!this.state.bidding || (this.state.whoseTurn !== this.state.player_index)}>
					<label> Difficulty: </label>
					<select value = {this.state.difficulty} onChange = {this.handleDiffChange}>
						{listDifficulty}
					</select>
					<label> Trump: </label>
					<select value = {this.state.trump.name} onChange ={this.handleTrumpChange}>
						{listTrumps}
					</select>
					<button className = "button" onClick = {this.handlebidding}>Bid</button>
					<button className = "button" onClick = {this.handlePass}>Pass</button>
				</div>
				
				<div hidden = {!this.state.playing || (this.state.whoseTurn !== this.state.player_index)}>
					<button className = "button" onClick = {this.handlePlayCard}>Play Card</button>
				</div>
				
				<div hidden = {!this.state.choose_partner || (this.state.whoseTurn !== this.state.player_index)}>
					<label>Value: </label>
					<select value = {this.state.difficulty} onChange = {this.handleDiffChange}>
						{listValues}
					</select>
					<label>Suit: </label>
					<select value = {this.state.trump} onChange ={this.handleTrumpChange}>
						{listSuits}
					</select>
					<button className = "button" onClick = {this.handleChoosePartner}>Choose Partner</button>
				</div>
				<div className = "statusbox">
					<p>{this.state.message}</p>
				</div>
			</div>
		);
	}
}

export default Bridge;
