import React from 'react';

class Player_list{
	constructor(num_players){
		this.list = [];
		let player = (name) => {
			this.name = name;
			this.score = 0;
			this.hand = [];
		return {name:this.name, score:this.score, hand:this.hand}
	}
		for(let i = 1; i <=num_players;i++){
			this.list.push(player("Player " + i))
		}
	}
	print_list(){
	for(let i = 0;i<this.list.length;i++){
		console.log(this.list[i])
		}
	}
}

export default Player_list;
