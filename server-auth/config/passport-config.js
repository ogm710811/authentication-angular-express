// require bcrypt for passport strategy config
const bcrypt        = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const passport      = require('passport');
// The same as:
// const passportLocal = require(passport-local);
// const LocalStrategy = passportLocal.Strategy;

const User          = require('../models/user-model.js');


// ***************************************************************
// PASSPORT GOES THROUGH THIS:
// 1. THE INPUT FORM
// 2. LOCAL STRATEGY CALL BACK
// 3. (if successful) PASSPORT SERIALIZER USER
// ***************************************************************

//*****************************************************************
// passport LOCAL login strategy
//*****************************************************************
passport.use(new LocalStrategy(
  // 1st argm -> option to custumize LocalStrategy
  // **** 1st argm IS NOT REQUIRE WHEN ANGULAR IS FRONTEND
  // 2nd argm -> callback for log in logic
  (username, password, next) => {
    User.findOne({username},
      (err, theUser) => {
        // tell passport if there was an error
      if (err) {
        next(err);
        return;
      }
      // tell passport if there is no user with given username
      if (!theUser) {
        // false in 2nd argm means "Login in failed!"
        next(null, false, { message: 'Wrong username' });
        return;            // message -> req.flash('error')
      }
      // tell passport if the passwords don't match 
      if(!bcrypt.compareSync(password, theUser.encryptedPassword)){
        // false in 2nd argm means "Login in failed!"
        next(null, false, { message: 'Wrong passport' });
        return;           // message -> req.flash('error')
      }

      // if we get this point of the code means password is correct
      // then we give passport the user's info details (SUCCESS!!!)
      next(null, theUser, { message: `login for ${ theUser.username } successsful` });
                          // message -> req.flash('error')
      // -> THIS GOES TO passport.serializerUser()   

    });
  }
));

// determines what to save in the session (what to put in the box)
// this passport method is called on EVERY request AFTER you log in
passport.serializeUser((user, cb) => {
  // cb is short for callback
  // in this example we are going to save the user's Id in the session (in the box)
  cb(null, user._id);
});

// determines where to get the rest of the user's information (given what's in the box)
passport.deserializeUser((userId, cb) => {
  // query the DB with the user's id
  User.findById(userId, (err, theUser) => {
    if (err) {
      cb(err);
      return;
    }
    // send the user's info to passport
    cb(null, theUser);
  });
});

