const AUTH_URL = spotifyApi.createAuthorizeURL(scopes, state);

var SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');

const scopes = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-library-read",
    "user-library-modify",
    "user-read-recently-played",
    "user-modify-playback-state",
    "playlist-modify-public",
    "user-top-read"
],
  clientId = "ad77472e217f43978b60be910b3304f8",
  clientSecret = 'f1c2b8dd919947feb3a7782886b38829',
  redirectUri = 'http://localhost:8888/callback',//'http://127.0.0.1:5500/index.html',
  state = 'open';


var spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    redirectUri: redirectUri,
    clientSecret: clientSecret
});

var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);


var app = express();

app.get('/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log('access_token:', access_token);
      console.log('refresh_token:', refresh_token);

      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      res.send('Success! You can now close the window.');

      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body['access_token'];

        console.log('The access token has been refreshed!');
        console.log('access_token:', access_token);
        spotifyApi.setAccessToken(access_token);
      }, expires_in / 2 * 1000);
    }
    )
    .catch(error => {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

app.listen(8888, () =>
  console.log(
    'HTTP Server up. Now go to http://localhost:8888/login in your browser.'
  )
);