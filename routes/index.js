var express = require('express');
var router = express.Router();
var userModel = require('./users');
var postModel = require('./posts');
var storyModel = require('./story');
var passport = require('passport');
var localStrategy = require('passport-local');
let upload = require('./multer');
let chatModel = require('./chats');

//passport configuration
passport.use(new localStrategy(userModel.authenticate()));


//authentication process

// user resgistration
router.post('/register', (req, res) => {
  let userData = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    contact: req.body.contact
  });
  userModel.register(userData, req.body.password).then(() => {
    passport.authenticate('local')(req, res, () => {
      res.redirect('/feed');
    })
  })
})


//user login

router.post('/login', passport.authenticate('local', {
  successRedirect: '/feed',
  failureRedirect: '/login',
  failureFlash: true //this will create a flash message if the user enters wrong credentials and will be displayed in the login page
}));

//user logout
router.get('/logout', (req, res) => {
  req.logout(function (error) {
    if (error) {
      console.log(error);
    } else {
      res.redirect('/login');
    }
  })
});

//update
router.post('/update', isLoggedIn, async (req, res) => {
  let userData = await userModel.findOne({ username: req.session.passport.user });
  userData.name = req.body.name;
  userData.username = req.body.username;
  userData.bio = req.body.bio;

  await userData.save();
  res.redirect('/profile');
});

//upload
router.post('/upload', isLoggedIn, upload.single('image'), async (req, res) => {
  let userData = await userModel.findOne({ username: req.session.passport.user });
  userData.picture = req.file.filename;
  await userData.save();
  res.redirect('/edit');
});

//post 
router.post('/upload/:type', isLoggedIn, upload.single('image'), async (req, res) => {

  let userData = await userModel.findOne({ username: req.session.passport.user });
  if (req.params.type == 'post') {
    let postData = await postModel.create({
      user: userData._id,
      caption: req.body.caption,
      picture: req.file.filename
    });
    userData.posts.push(postData._id);
  }
  else {
    let storyData = await storyModel.create({
      user: userData._id,
      story: req.file.filename
    });
    userData.stories.push(storyData._id);
  }
  await userData.save();
  res.redirect('/feed');
});

//chat
router.post('/chat/:Receiver', isLoggedIn, async (req, res) => {
  let sender = await userModel.findOne({ username: req.session.passport.user });
  let receiver = await userModel.findOne({ _id: req.params.Receiver });
  console.log("sender user name is " + sender.username);
  console.log("receiver user name is " + receiver.username);

  // Try to find an existing chat in both directions
  let chatData = await chatModel.findOne({ from: sender._id, to: receiver._id });
  let chatData2 = await chatModel.findOne({ from: receiver._id, to: sender._id });

  // If neither chat exists, create a new one
  if (!chatData && !chatData2) {
    console.log("Creating a new chat");
    chatData = await chatModel.create({
      from: sender._id,
      to: receiver._id,
    });
    sender.allChats.push(chatData._id);
    receiver.allChats.push(chatData._id);
  } else {
    console.log("Using existing chat");
    // If chatData is null but chatData2 exists, use chatData2
    if (!chatData) {
      chatData = chatData2;
    }
  }

  // Push the new message with the correct structure
  console.log("New message:", req.body.message);
  chatData.messages.push({
    msg: req.body.message,
    sender: sender._id,
    receiver: receiver._id
  });

  // Save changes
  await chatData.save();
  await sender.save();
  await receiver.save();

  // Decide where to redirect based on the form origin
  if (req.body.origin === 'story') {
    res.redirect(`/story/${receiver._id}`);
  } else {
    res.redirect(`/chat/message/${receiver._id}`);
  }
});






//GET


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('register', { footer: false });
});



//chack if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

//login
router.get('/login', (req, res) => {
  res.render('login', { error: req.flash('error'), footer: false });
});

//feed
router.get('/feed', isLoggedIn, async (req, res) => {
  let posts = await postModel.find().populate('user');
  let userData = await userModel.findOne({ username: req.session.passport.user });
  let users = await userModel.find();
  res.render('feed', { footer: true, posts, userData, users });

});

//profile
router.get('/profile', isLoggedIn, async (req, res) => {
  let userData = await userModel.findOne({ username: req.session.passport.user }).populate('posts');
  res.render('profile', { footer: true, userData, allowed: true });
});

//edit
router.get('/edit', isLoggedIn, async (req, res) => {
  let userData = await userModel.findOne({ username: req.session.passport.user });
  res.render('edit', { footer: true, userData });
});

//upload
router.get('/upload/:type', isLoggedIn, (req, res) => {
  if (req.params.type == 'post') res.render('upload', { footer: false });
  else res.render('uploadStory', { footer: false });
});

//search users
router.get('/search', isLoggedIn, async (req, res) => {
  let userData = await userModel.findOne({ username: req.session.passport.user });
  res.render('search', { footer: true, userData });
})

//post like
router.get('/post/like/:postid', isLoggedIn, async (req, res) => {
  let singlePost = await postModel.findOne({ _id: req.params.postid });
  let userData = await userModel.findOne({ username: req.session.passport.user });
  if (singlePost.like.indexOf(userData._id) === -1) {
    //not liked yet
    singlePost.like.push(userData._id);
  }
  else {
    singlePost.like.splice(singlePost.like.indexOf(userData._id), 1);
  }

  await singlePost.save();
  res.redirect('/feed');
})

router.get('/username/:userN', isLoggedIn, async (req, res) => {
  const regex = new RegExp('^' + req.params.userN, 'i');//^ define the starting character for search & i is used for insesitive search
  let users = await userModel.find({ username: regex });
  res.json(users);
})


//story
router.get('/story/:username', isLoggedIn, async (req, res) => {
  let userData = await userModel.findOne({ _id: req.params.username }).populate('stories');
  let user = await userModel.findOne({ username: req.session.passport.user });
  if (user.username === userData.username) res.render('story', { userData, allowed: false });
  else res.render('story', { userData, allowed: true });

})

//open search profile
router.get('/chats/:user', isLoggedIn, async (req, res) => {
  let allusers = await userModel.find();
  let userData = await userModel.findOne({ username: req.session.passport.user })
    .populate({
      path: 'allChats',
      populate: { path: 'from', select: 'username picture' }
    })
    .populate({
      path: 'allChats',
      populate: { path: 'to', select: 'username picture' }
    })
  res.render('chats', { userData, allusers });
});

//conversation
router.get('/chat/message/:userId', isLoggedIn, async (req, res) => {
  let userData = await userModel.findOne({ username: req.session.passport.user })
    .populate({
      path: 'allChats',
      populate: [
        { path: 'from', select: 'username picture' },
        { path: 'to', select: 'username picture' }
      ]
    });

  // Find the chat where the logged-in user is either the sender or the receiver
  let chatData = await chatModel.findOne({ from: userData._id, to: req.params.userId })
    .populate({
      path: 'messages',
      populate: [
        { path: 'sender', select: 'username picture' },
        { path: 'receiver', select: 'username picture' }
      ]
    });
  if (!chatData) {
    chatData = await chatModel.findOne({ to: userData._id, from: req.params.userId })
      .populate({
        path: 'messages',
        populate: [
          { path: 'sender', select: 'username picture' },
          { path: 'receiver', select: 'username picture' }
        ]
      });
  }
  var other = await userModel.findOne({ _id: req.params.userId });
  //console.log("other is : "+other);
  //console.log("chat data is : ", chatData);
  res.render('conversation', { userData, chatData, other });
});
//on clicking  profile on search bar
router.get('/profile/:userId', isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ username: req.session.passport.user }).populate('posts');
  let userData = await userModel.findOne({ _id: req.params.userId }).populate('posts');
  if (user.username == userData.username) {
    res.render('profile', { footer: true, userData, allowed: true });
  }
  else {
    res.render('profile', { footer: true, userData, allowed: false });
  }


});

module.exports = router;