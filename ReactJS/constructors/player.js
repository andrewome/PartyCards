class player {
	constructor(num_players){
		this.list = [];
		let player = (name) => {
			this.name = name;
			this.score = 0;
			this.hand = [];
			this.id = "";
			this.passVote = -1;
			return {name:this.name, score:this.score, hand:this.hand, id:this.id};
		}
		for(let i = 1; i <=num_players;i++) {
			this.list.push(player("Player " + i));
		}
	}

	print_list() {
		for(let i = 0;i<this.list.length;i++) {
			console.log(this.list[i]);
		}
	}

	resetPassVotes() {
		for(var i=0;i<this.list.length;i++) {
			this.list[i].passVote = -1;
		}
	}
}


export default player;
