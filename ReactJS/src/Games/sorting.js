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
  }
}

export default Sort;
