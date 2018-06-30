import React from 'react';

const Sort = {
  byValue(playerhand){
    for(let i = 0;i<playerhand.length;i++){
      var changed = 0;
      for(let j = 0;j<playerhand.length -1;j++){
        if(playerhand[j].value.num > playerhand[j+1].value.num){
          var changed = 1
          var temp = playerhand[j]
          playerhand[j] = playerhand[j+1]
          playerhand[j+1] = temp;
        }
        else{
          continue;
        }
      }
      if(changed == 0){
          break;
      }
    }
  }
}

export default Sort;
