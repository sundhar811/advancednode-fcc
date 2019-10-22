const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local');
const ObjectID = require('mongodb').ObjectID;

module.exports = function (app, db) {
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    db.collection('users').findOne({ _id: new ObjectID(id) }, (err, data) => {
      done(null, data);
    });
  });

  passport.use(new LocalStrategy((username, password, done) =>{
    db.collection('users').findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to login`);
      if (err) return done(err);
      if (!user) return done(null, false);
      if (!bcrypt.compareSync(password, user.password)) return done(null, false);
      return done(null, user);
    });
  }));
}