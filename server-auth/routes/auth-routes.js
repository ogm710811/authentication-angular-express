const express    = require('express');
const passport   = require('passport');
const bcrypt     = require('bcrypt');
const User       = require('../models/user-model');

const authRoutes = express.Router();

/*
    Define our routes

    We want to provide basic authentication features, and along with login and logout methods
    we want to expose a way for the client to know if the user is logged in.

    We will define this API:
    METHOD      URL         PARAMETER               DESCRIPTION
    POST	    /signup	    username, password	    Create a new user if the username doesn’t exist in the db
    POST	    /login	    username, password	    Create a new session and return the user resource
    POST	    /logout	        -	                Delete the current session
    GET	        /loggedin	    -	                Check for a session and return the user resource
    GET	        /private	    -	                Check for a session and return some private data

    Notice that we don’t need routes for the Sign Up and Log In forms. Those will be on the Angular side!
    authRoutes.get('/signup', 
        ensure.ensureNotLoggedIn('/'),
    (req, res, next) => {
        res.render('auth/signup-view.ejs');
    });

    authRoutes.get('/login', 
      ensure.ensureNotLoggedIn('/'),
      (req, res, next) => {
        res.render('auth/login-view.ejs', {
            errorMessage: req.flash('error')
        });
    });

*/

/*******************************************************************************************************************/
// ROUTES HERE ...
/********************************************************************************************************************/
// 1. The Sign Up POST route checks for a user with the same username and if it does not exist it creates a new one.
authRoutes.post('/signup', (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    // don't let user submit blanck username and password
    // see that in this case we are responding with status(400).json()
    if (!username || !password) {
        res.status(400).json({ message: 'Provide username and password' });
        return;
    }

    // don't let the user register with a username already exist
    // have  to check in DB
    User.findOne(
        { username }, 
        '_.id',
        (err, foundUser) => {
            if (foundUser) {
                res.status(400).json({ message: 'The username already exists' });
                return;
            }

            //*********************************************************
            // no problem so far, then we are good to go
            //********************************************************* 
            const salt      = bcrypt.genSaltSync(10);
            const hashPass  = bcrypt.hashSync(signupPassword, salt);

            // create a new user (username and password)
            const theUser = new User({
                username : username,
                encryptedPassword : hashPass
            });

            // save new user in DB
            theUser.save((err) => {
                if (err) {
                    res.status(400).json({ message: 'Something went wrong' });
                    return;
                }
                /*
                    LOG IN function:
                    Passport exposes a login() function on req (also aliased as logIn()) that can be used to establish a login session.
                    When the login operation completes, user will be assigned to req.user.
                    IMPORTANT!! => passport.authenticate() middleware invokes req.login() automatically. 
                    This function is primarily used when users sign up, during which req.login() can be invoked 
                    to automatically log in the newly registered user.
                */
                req.login(theUser, (err) => {
                    if (err) {
                        res.status(500).json({ message: 'Something went wrong' });
                        return;
                    }
                    // if no problem, when the login operation completes, user will be assigned to req.user.
                    res.status(200).json(req.user);
                });
            });
    });
});

// 2. The Log In route uses the passport middleware to authenticate the user. 
// If an error happens or the user is not found it returns an error.
authRoutes.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, theUser, failureDetails) => {
        // if err, server responses with code 500 = Internal Server Error
        if (err) {
            res.status(500).json({ message: 'Something went wrong' });
            return;
        }

        // if the user is not found, server responses with code 401 = Unauthorized
        if (!theUser) {
            res.status(401).json(failureDetails);
            return;
        }

        // login() function on req (also aliased as logIn()) that can be used to establish a login session.
        req.login(theUser, (err) => {
            if (err) {
                res.status(500).json({ message: 'Something went wrong' });
                return;
            }

            // We are now logged in (notice req.user)
            res.status(200).json(req.user);
        });
    })(req, res, next);
});

// 3. The Log Out route just logs the user out and returns a success message.
authRoutes.post('/logout', (req, res, next) => {
  req.logout();
  res.status(200).json({ message: 'Success' });
});

// 4. The Logged In route is from the client to know if the user is authenticated or not. 
// The Passport function isAuthenticated comes into play here. If the result is true the 
// API returns the user, otherwise an Unauthorized message:
authRoutes.get('/loggedin', (req, res, next) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
    return;
  }
  // code 403 = Forbidden
  res.status(403).json({ message: 'Unauthorized' });
});

// 5. The Private route looks a lot like the loggedin routes. 
// The difference lies in the response content, in this case some protected and user-unrelated data:
authRoutes.get('/private', (req, res, next) => {
  if (req.isAuthenticated()) {
    res.json({ message: 'This is a private message' });
    return;
  }
  // code 403 = Forbidden
  res.status(403).json({ message: 'Unauthorized' });
});

 module.exports = authRoutes;