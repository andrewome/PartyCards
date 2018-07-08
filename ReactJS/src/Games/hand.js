import React, { Component } from 'react';
import './Games.css';
import Sort from './sorting';

function importAll(r) {
  let images = {};
  r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
  return images;
}

const images = importAll(require.context('./card_images', false, /\.(png|jpe?g|svg)$/));

class Hand extends Component{
  constructor(props){
    super(props);
    this.state = {
      hand: this.props.playerhand,
      selected_cards: []
    }
  }
  render(){
    var playerhand = this.props.playerhand
    var selectedcards = this.state.selected_cards;
    var disable = this.props.disabled;
    Sort.byValue(playerhand);
    const listHand = playerhand.map((d) =>
      <img className = "cards" src = {images[d.value.sym + d.suit[0] + '.png']}
        onClick = {() =>{
          if(this.props.disabled){
            return;
          }
          let index = playerhand.findIndex(x => x.name === d.name)
          playerhand.splice(index, 1)
          selectedcards.push(d)
          this.props.OnHandleplayerhand(playerhand)
          this.props.OnHandleselectedcards(selectedcards)
          this.setState({player_hand: playerhand})
          this.setState({selected_cards: selectedcards})
        }}/>
    );
    const listCards = selectedcards.map((d) =>
      <img className = "cards" src ={images[d.value.sym + d.suit[0] + '.png']} onClick = {() =>{
      if(this.props.disabled){
          return;
      }
      let index = selectedcards.findIndex(x => x.name === d.name)
      selectedcards.splice(index, 1)
      playerhand.push(d)
      this.props.OnHandleselectedcards(selectedcards)
      this.props.OnHandleplayerhand(playerhand)
      this.setState({player_hand: playerhand})
      this.setState({selected_cards: selectedcards})
    }
    } disabled = {disable}/>);


    return(
      <div>
        <div className = "handtest">
          {listHand}
          </div>
        <div className = "handtest">
          <p>Selected Cards: </p>
          {listCards}
        </div>
      </div>

    );
  }

}


export default Hand;
