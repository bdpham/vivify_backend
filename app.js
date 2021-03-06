/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = process.env.SPOTIFY_ID; // Your client id
var client_secret = process.env.SPOTIFY_SECRET; // Your secret
var redirect_uri = 'vivify://callback'; // Your redirect uri

// /**
//  * Generates a random string containing numbers and letters
//  * @param  {number} length The length of the string
//  * @return {string} The generated string
//  */
// var generateRandomString = function(length) {
//   var text = '';
//   var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//
//   for (var i = 0; i < length; i++) {
//     text += possible.charAt(Math.floor(Math.random() * possible.length));
//   }
//   return text;
// };

var stateKey = 'spotify_auth_state';

var app = express();



app.get('/login', function(req, res) {

  // var state = generateRandomString(16);
  // res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri
    }));
});

app.get('/getTokens/:code', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.params.code;

    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

    //     var options = {
    //       url: 'https://api.spotify.com/v1/me',
    //       headers: { 'Authorization': 'Bearer ' + access_token },
    //       json: true
    //     };
    //
    //     // use the access token to access the Spotify Web API
    //     request.get(options, function(error, response, body) {
    //       console.log(body);
    //     });

        // we can also pass the token to the browser to make requests from there
        res.send({
            access_token: access_token,
            'refresh_token': refresh_token,
            'expires_in': body.expires_in
          });
     }
       else {
        res.send({
            error: 'invalid_token'
          });
      }
    });
  //}
});

app.get('/refresh_token/:refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.params.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token,
        'expires_in': body.expires_in
      });
    }
  });
});

var port = Number(process.env.PORT || 3000);
app.listen(port);
console.log('Listening on port 3000');
