module.exports = function (app) {
  var bcrypt = require('bcryptjs');

  var cookieParser = require('cookie-parser');
  // var cookieSession = require('cookie-session');
  var bodyParser = require('body-parser');
  var expressSession = require('express-session');
  var passport = require('passport');
  var plocal = require('passport-local');
  var flash = require('connect-flash');

  app.use(cookieParser());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(expressSession({
    secret: '5 pudding cups: scanrepo',
    resave: true,
    saveUninitialized: true
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());

  var db = require('../db');
  var oid = require('mongodb').ObjectId;
  var usersCol = function () {
    return db.get().collection('users');
  };

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    usersCol().findOne({ _id: oid(id) }, function (err, user) { 
      done(err, user);
    });
  });

  passport.use('login', new plocal({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    }, function(req, username, password, done) {
      usersCol().findOne({ username:  username }, function (err, user) {
        if (err) return done(err);
        // No user found.
        if (!user) {
          return done(null, false,
                req.flash('message', 'User Not found.'));
        }
        // Wrong password.
        if (!bcrypt.compareSync(password, user.password)){
          return done(null, false,
              req.flash('message', 'Invalid Password'));
        } else {
          return done(null, user);
        }
      });
  }));

  var hashPass = function (password) {
   return bcrypt.hashSync(password, bcrypt.genSaltSync(12));
  };

  passport.use('register', new plocal({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    }, function(req, username, password, done) {
      process.nextTick(function () {
        usersCol().findOne({ username: username}, function (err, user) {
          if (err) {
            console.log('Error in register: '+err);
            return done(err);
          }
          if (user) {
            return done(null, false,
               req.flash('message','User Already Exists'));
          } else {
            var newUser = {
              username: username,
              password: hashPass(password)
              // email: req.param('email'),
              // firstName: req.param('firstName'),
              // lastName: req.param('lastName'),
            };

            // save the new user
            usersCol().insertOne(newUser, function(err, res) {
              if (err) {
                console.log('Error saving user: ', err, '\nResult: ', res);
                throw err;
              }
              return done(null, newUser);
            });
          }
        });
      });
    })
  );

  return passport;
};
