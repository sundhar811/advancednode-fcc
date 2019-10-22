'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const pug = require('pug');
const passport = require('passport');
const session = require('express-session');
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;
const LocalStrategy = require('passport-local');
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
};

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'pug');

app.route('/')
  .get((req, res) => {
    res.render(process.cwd() + '/views/pug/index.pug', {
      title: 'Home Page',
      message: 'Please login',
      showLogin: true,
      showRegistration: true
    });
  });

app.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
  });

mongo.connect(process.env.DATABASE, (err, db) => {
  if(err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');
    
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
        if (password !== user.password) return done(null, false);
        return done(null, user);
      });
    }));
    
    app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      res.redirect('/profile');
    });
    
    app.route('/profile')
      .get(ensureAuthenticated, (req, res) => {
        res.render(process.cwd() + '/views/pug/profile.pug', { username: req.user.username });
      });
    
    app.route('/register')
      .post((req, res, next) => {
        db.collection('users').findOne({ username: req.body.username }, (err, user) => {
          if(err) next(err);
          else if (user) res.redirect('/')
          else {
            db.collection('users').insertOne({
              username: req.body.username,
              password: req.body.password
            }, (err, doc) => {
              if (err) res.redirect('/');
              else next(null, user);
            });
          }
        });
      }, passport.authenticate('local', { failureRedirect: '/' }),(req, res, next) => res.redirect('/profile'));
    
    app.use((req, res, next) => {
      res.status(404)
        .type('text')
        .send('Not Found')
    });
    
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
});