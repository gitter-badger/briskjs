'use strict';

const _ = require('lodash');
const passport = require('passport');
const request = require('request');
const InstagramStrategy = require('passport-instagram').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const OpenIDStrategy = require('passport-openid').Strategy;
const OAuthStrategy = require('passport-oauth').OAuthStrategy;
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

const secrets = require('./secrets');
const User = require('../app/models/User');

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

/**
 * Sign in with Instagram.
 */
passport.use(new InstagramStrategy(secrets.instagram, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({instagram: profile.id}, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {msg: 'There is already an Instagram account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.instagram = profile.id;
          user.tokens.push({kind: 'instagram', accessToken: accessToken});
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile._json.data.profile_picture;
          user.profile.website = user.profile.website || profile._json.data.website;
          user.save(function (err) {
            req.flash('info', {msg: 'Instagram account has been linked.'});
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({instagram: profile.id}, function (err, existingUser) {
      if (existingUser) {
        return done(null, existingUser);
      }
      let user = new User();
      user.instagram = profile.id;
      user.tokens.push({ kind: 'instagram', accessToken });
      user.profile.name = profile.displayName;
      // Similar to Twitter API, assigns a temporary e-mail address
      // to get on with the registration process. It can be changed later
      // to a valid e-mail address in Profile Management.
      user.email = profile.username + '@instagram.com';
      user.profile.website = profile._json.data.website;
      user.profile.picture = profile._json.data.profile_picture;
      user.save(function (err) {
        done(err, user);
      });
    });
  }
}));

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, function (emailAddress, password, done) {
  const email = emailAddress.toLowerCase();
  User.findOne({ email }, function (err, user) {
    if (!user) {
      return done(null, false, { message: 'Email ' + email + ' not found' });
    }
    user.comparePassword(password, function (err, isMatch) {
      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password.' });
      }
      return done(null, user);
    });
  });
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy(secrets.facebook, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({ facebook: profile.id }, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.facebook = profile.id;
          user.tokens.push({ kind: 'facebook', accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.gender = user.profile.gender || profile._json.gender;
          user.profile.picture = user.profile.picture ||
            'https://graph.facebook.com/' + profile.id + '/picture?type=large';
          user.save(function (err) {
            req.flash('info', { msg: 'Facebook account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ facebook: profile.id }, function (err, existingUser) {
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile._json.email }, function (err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.' });
          done(err);
        } else {
          let user = new User();
          user.email = profile._json.email;
          user.facebook = profile.id;
          user.tokens.push({ kind: 'facebook', accessToken });
          user.profile.name = profile.displayName;
          user.profile.gender = profile._json.gender;
          user.profile.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
          user.profile.location = (profile._json.location) ? profile._json.location.name : '';
          user.save(function (err) {
            done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Sign in with GitHub.
 */
passport.use(new GitHubStrategy(secrets.github, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({github: profile.id}, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {msg: 'There is already a GitHub account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.github = profile.id;
          user.tokens.push({kind: 'github', accessToken: accessToken});
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile._json.avatar_url;
          user.profile.location = user.profile.location || profile._json.location;
          user.profile.website = user.profile.website || profile._json.blog;
          user.save(function (err) {
            req.flash('info', {msg: 'GitHub account has been linked.'});
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({github: profile.id}, function (err, existingUser) {
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({email: profile._json.email}, function (err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', {msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.'});
          done(err);
        } else {
          var user = new User();
          user.email = profile._json.email;
          user.github = profile.id;
          user.tokens.push({kind: 'github', accessToken: accessToken});
          user.profile.name = profile.displayName;
          user.profile.picture = profile._json.avatar_url;
          user.profile.location = profile._json.location;
          user.profile.website = profile._json.blog;
          user.save(function (err) {
            done(err, user);
          });
        }
      });
    });
  }
}));

// Sign in with Twitter.

passport.use(new TwitterStrategy(secrets.twitter, function (req, accessToken, tokenSecret, profile, done) {
  if (req.user) {
    User.findOne({twitter: profile.id}, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {msg: 'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.twitter = profile.id;
          user.tokens.push({kind: 'twitter', accessToken: accessToken, tokenSecret: tokenSecret});
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.location = user.profile.location || profile._json.location;
          user.profile.picture = user.profile.picture || profile._json.profile_image_url_https;
          user.save(function (err) {
            req.flash('info', {msg: 'Twitter account has been linked.'});
            done(err, user);
          });
        });
      }
    });

  } else {
    User.findOne({twitter: profile.id}, function (err, existingUser) {
      if (existingUser) {
        return done(null, existingUser);
      }
      var user = new User();
      // Twitter will not provide an email address.  Period.
      // But a person’s twitter username is guaranteed to be unique
      // so we can "fake" a twitter email address as follows:
      user.email = profile.username + "@twitter.com";
      user.twitter = profile.id;
      user.tokens.push({kind: 'twitter', accessToken: accessToken, tokenSecret: tokenSecret});
      user.profile.name = profile.displayName;
      user.profile.location = profile._json.location;
      user.profile.picture = profile._json.profile_image_url_https;
      user.save(function (err) {
        done(err, user);
      });
    });
  }
}));

/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy(secrets.google, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({google: profile.id}, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.google = profile.id;
          user.tokens.push({kind: 'google', accessToken: accessToken});
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.gender = user.profile.gender || profile._json.gender;
          user.profile.picture = user.profile.picture || profile._json.image.url;
          user.save(function (err) {
            req.flash('info', {msg: 'Google account has been linked.'});
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({google: profile.id}, function (err, existingUser) {
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({email: profile.emails[0].value}, function (err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', {msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.'});
          done(err);
        } else {
          var user = new User();
          user.email = profile.emails[0].value;
          user.google = profile.id;
          user.tokens.push({kind: 'google', accessToken: accessToken});
          user.profile.name = profile.displayName;
          user.profile.gender = profile._json.gender;
          user.profile.picture = profile._json.image.url;
          user.save(function (err) {
            done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Sign in with LinkedIn.
 */
passport.use(new LinkedInStrategy(secrets.linkedin, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({linkedin: profile.id}, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {msg: 'There is already a LinkedIn account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.linkedin = profile.id;
          user.tokens.push({kind: 'linkedin', accessToken: accessToken});
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.location = user.profile.location || profile._json.location.name;
          user.profile.picture = user.profile.picture || profile._json.pictureUrl;
          user.profile.website = user.profile.website || profile._json.publicProfileUrl;
          user.save(function (err) {
            req.flash('info', {msg: 'LinkedIn account has been linked.'});
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({linkedin: profile.id}, function (err, existingUser) {
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({email: profile._json.emailAddress}, function (err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', {msg: 'There is already an account using this email address. Sign in to that account and link it with LinkedIn manually from Account Settings.'});
          done(err);
        } else {
          var user = new User();
          user.linkedin = profile.id;
          user.tokens.push({kind: 'linkedin', accessToken: accessToken});
          user.email = profile._json.emailAddress;
          user.profile.name = profile.displayName;
          user.profile.location = profile._json.location.name;
          user.profile.picture = profile._json.pictureUrl;
          user.profile.website = profile._json.publicProfileUrl;
          user.save(function (err) {
            done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Tumblr API OAuth.
 */
passport.use('tumblr', new OAuthStrategy({
    requestTokenURL: 'http://www.tumblr.com/oauth/request_token',
    accessTokenURL: 'http://www.tumblr.com/oauth/access_token',
    userAuthorizationURL: 'http://www.tumblr.com/oauth/authorize',
    consumerKey: secrets.tumblr.consumerKey,
    consumerSecret: secrets.tumblr.consumerSecret,
    callbackURL: secrets.tumblr.callbackURL,
    passReqToCallback: true
  },
  function (req, token, tokenSecret, profile, done) {
    User.findById(req.user._id, function (err, user) {
      user.tokens.push({kind: 'tumblr', accessToken: token, tokenSecret: tokenSecret});
      user.save(function (err) {
        done(err, user);
      });
    });
  }
));

/**
 * Foursquare API OAuth.
 */
passport.use('foursquare', new OAuth2Strategy({
    authorizationURL: 'https://foursquare.com/oauth2/authorize',
    tokenURL: 'https://foursquare.com/oauth2/access_token',
    clientID: secrets.foursquare.clientId,
    clientSecret: secrets.foursquare.clientSecret,
    callbackURL: secrets.foursquare.redirectUrl,
    passReqToCallback: true
  },
  function (req, accessToken, refreshToken, profile, done) {
    User.findById(req.user._id, function (err, user) {
      user.tokens.push({kind: 'foursquare', accessToken: accessToken});
      user.save(function (err) {
        done(err, user);
      });
    });
  }
));

/**
 * Venmo API OAuth.
 */
passport.use('venmo', new OAuth2Strategy({
    authorizationURL: 'https://api.venmo.com/v1/oauth/authorize',
    tokenURL: 'https://api.venmo.com/v1/oauth/access_token',
    clientID: secrets.venmo.clientId,
    clientSecret: secrets.venmo.clientSecret,
    callbackURL: secrets.venmo.redirectUrl,
    passReqToCallback: true
  },
  function (req, accessToken, refreshToken, profile, done) {
    User.findById(req.user._id, function (err, user) {
      user.tokens.push({kind: 'venmo', accessToken: accessToken});
      user.save(function (err) {
        done(err, user);
      });
    });
  }
));

/**
 * Steam API OpenID.
 */
passport.use(new OpenIDStrategy(secrets.steam, function (identifier, done) {
  var steamId = identifier.match(/\d+$/)[0];
  var profileURL = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + secrets.steam.apiKey + '&steamids=' + steamId;

  User.findOne({steam: steamId}, function (err, existingUser) {
    if (existingUser) return done(err, existingUser);
    request(profileURL, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        var profile = data.response.players[0];

        var user = new User();
        user.steam = steamId;
        user.email = steamId + '@steam.com'; // steam does not disclose emails, prevent duplicate keys
        user.tokens.push({kind: 'steam', accessToken: steamId});
        user.profile.name = profile.personaname;
        user.profile.picture = profile.avatarmedium;
        user.save(function (err) {
          done(err, user);
        });
      } else {
        done(error, null);
      }
    });
  });
}));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = function (req, res, next) {
  var provider = req.path.split('/').slice(-1)[0];

  if (_.find(req.user.tokens, {kind: provider})) {
    next();
  } else {
    res.redirect('/auth/' + provider);
  }
};
