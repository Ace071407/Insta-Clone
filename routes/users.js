let mongoose = require('mongoose');
let plm = require('passport-local-mongoose');
mongoose.connect('mongodb://localhost:27017/iClone');

var userSchema = mongoose.Schema({ username: String,
  name: String,
  email: String,
  password: String,
  picture: {
    type: String,
    default: "def.png"
  },
  contact: String,
  bio: String,
  stories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "story" 
    }
  ],
  saved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post" 
    }
  ],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "post" 
  }],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user" 
    } 
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user" 
    }
  ],
  allChats:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"chat"
  }]
  
});
userSchema.plugin(plm);
module.exports = mongoose.model('user',userSchema);