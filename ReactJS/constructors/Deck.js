import React from 'react';

class Deck {
	constructor() {
		this.deck = [];
		this.dealt_cards = [];
	}

	generate_deck() {
		let card = (suit,value) => {
			this.name = value.sym + ' of ' + suit
			this.suit = suit
			this.value = value
			return {name:this.name, suit:this.suit, value:this.value}
		};
		//let values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
		let values = [{sym :'2',num : 0},{sym :'3',num : 1},{sym :'4',num : 2},{sym :'5',num : 3},{sym :'6',num : 4},{sym :'7',num : 5},{sym :'8',num : 6}
					,{sym :'9',num : 7},{sym :'10',num : 8},{sym :'J',num : 9},{sym :'Q',num : 10},{sym :'K',num : 11},{sym :'A',num : 12}];
		let suits = ['Clubs','Diamonds','Hearts','Spades'];
		for(let i = 0;i<suits.length;i++) {
			for(let j = 0;j < values.length;j++) {
				this.deck.push(card(suits[i],values[j]));
			}
		}
	}

	print_deck() {
		if(this.deck.length == 0){
			console.log("The deck has not been generated")
		}
		else {
			for(let i = 0;i<this.deck.length;i++){
			console.log(this.deck[i].name)
			}
		}
	}
	shuffle() {
		let index = this.deck.length, temp_val, rand_index
		while(0 != index) {
			rand_index = Math.floor(Math.random() * index)
			index -= 1;
			temp_val = this.deck[index]
			this.deck[index] = this.deck[rand_index]
			this.deck[rand_index] = temp_val
		}
	}
	top_deck() {
		return this.deck[0].name
	}
	deal() {
		//let card be the top card of the deck
		let card = this.deck.shift()
		this.dealt_cards.push(card);
		return card;
	}
	size () {
		return this.deck.length
	}
}

export default Deck;
