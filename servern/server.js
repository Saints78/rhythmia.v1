// var scopes = ["streaming",
//     "user-read-email",
//     "user-read-private",
//     "user-library-read",
//     "user-library-modify",
//     "user-read-recently-played",
//     "user-modify-playback-state",
//     "playlist-modify-public",
//     "user-top-read"], 
//     redirectUri = "http://127.0.0.1:5500/index.html"
//     clientId = 'ad77472e217f43978b60be910b3304f8'
//     state = 'active';

// var spotifyApi = new SpotifyWebApi({ 
//     redirectUri: redirectUri, 
//     clientId: clientId
// });

// var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

// console.log(authorizeURL);

const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();

app.post('/login', (req, res) => {
    const code = req.body.code
    const spotifyAPI = new SpotifyWebApi({
        redirectUri: "http://127.0.0.1:5500/index.html",
        clientId:"ad77472e217f43978b60be910b3304f8",
        clientSecret: "f1c2b8dd919947feb3a7782886b38829"
    })

    spotifyApi.authorizationCodeGrant(code).then(data => {
        res.json({
            accessToken = data.body.access_token,
            refreshToken: data.body.refresh,
            expiresIn: data.body.expires_in
        })
        .catch(() =>{
            res.sendStatus(400)
        })
    })
})