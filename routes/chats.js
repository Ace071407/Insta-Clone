let mongoose = require('mongoose');
let chatSchema = mongoose.Schema({
    messages: [{
         msg: {
             type: String,
             default:""           
          },
          sender:{type:mongoose.Schema.Types.ObjectId , ref:'user'},
          receiver:{type:mongoose.Schema.Types.ObjectId , ref:'user'}
    }],
from: {
    type: mongoose.Schema.Types.ObjectId,
        ref: "user"
},
to: {
    type: mongoose.Schema.Types.ObjectId,
        ref: "user"
},
date: {
    type: Date,
      default: Date.now
}
  });
module.exports = mongoose.model('chat', chatSchema);
