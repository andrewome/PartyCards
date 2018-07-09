const Sort = {
  byValue(playerhand){
    for(let i = 0;i<playerhand.length;i++){
      var changed = 0;
      for(let j = 0;j<playerhand.length -1;j++){
        if(playerhand[j].value.num > playerhand[j+1].value.num){
          changed = 1
          var temp = playerhand[j]
          playerhand[j] = playerhand[j+1]
          playerhand[j+1] = temp;
        }
        else{
          continue;
        }
      }
      if(changed === 0){
          break;
      }
    }
    return;
  },
  ValuesinHand(playerhand){
    var values = [];
    for(let i = 0;i<playerhand.length;i++){
      if(values.findIndex((x) => {x ===
          playerhand[i].value.sym
      } ) === -1){
        values.push(playerhand[i].value.sym)
      }
    }
    return values;
  },
  bySuit(playerhand){
    let H = [], C = [], D = [], S = [];
    for(let i = 0;i<playerhand.length;i++){
      if(playerhand[i].suit === "Hearts"){
        H.push(playerhand[i])
      }
      else if(playerhand[i].suit === "Clubs"){
        C.push(playerhand[i]);
      }
      else if(playerhand[i].suit === "Diamonds"){
        D.push(playerhand[i]);
      }
      else if(playerhand[i].suit === "Spades"){
        S.push(playerhand[i]);
      }
    }
    Sort.byValue(H);Sort.byValue(C);Sort.byValue(D);Sort.byValue(S);
    var result = C.concat(D,S,H)
    return result;
  }
}

export default Sort;
