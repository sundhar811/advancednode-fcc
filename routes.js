const passport = require('passport');
const bcrypt = require('bcrypt');
const pug = require('pug');

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
};

module.exports = function (app, db) {
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
          let hash = bcrypt.hashSync(req.body.password, 12);
          db.collection('users').insertOne({
            username: req.body.username,
            password: hash
          }, (err, doc) => {
            if (err) res.redirect('/');
            else next(null, user);
          });
        }
      });
    }, passport.authenticate('local', { failureRedirect: '/' }),(req, res, next) => res.redirect('/profile'));
}