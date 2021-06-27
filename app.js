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

const AUTH_URL = "https://accounts.spotify.com/authorize?client_id=ad77472e217f43978b60be910b3304f8&response_type=code&redirect_uri=http://127.0.0.1:5500/index.html&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-recently-played%20user-modify-playback-state%20playlist-modify-public%20user-top-read&state=open";

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

      const SpotifyWebApi = require('spotify-web-api-node');

const token = access_token;

const spotifyAPI = new SpotifyWebApi();
spotifyAPI.setAccessToken(token);

function createPlaylist(){
    (async () => {
        const me = await spotifyAPI.getMe();
        //console.log(me.body);

        //getUserPlaylists(me.body.id);
        //let likedSongs = await getLikedSongs();


        //creates a new playlist and gets the id of the playlist
        await initializePlaylist();
        let wkoutPlaylistID = await getPlaylistByName(me.body.id, "Rhythmia Playlist");

        // gets the top artists and tracks
        let topArtists = await getTopArtists();
        let topTracks = await getTopTracks();

        // gets warmup songs and adds them to the newly created playlist.
        let warmupSegment = await getWarmupTracks(topTracks, topArtists);

        let warmupURIs = [];
        for(let tracks of warmupSegment){
            warmupURIs.push(tracks.uri);
        }
    
        await spotifyAPI.addTracksToPlaylist(wkoutPlaylistID, warmupURIs);
        console.log("Warmup Added!");

        // gets workout songs and adds them to the newly created playlist
        let workoutSegment = await getWorkoutTracks(topTracks, topArtists);
        let workoutURIs = [];
        for(let tracks of workoutSegment){
            workoutURIs.push(tracks.uri);
        }

        await spotifyAPI.addTracksToPlaylist(wkoutPlaylistID, workoutURIs);
        console.log("Workout Added!");

        // gets cooldown songs and adds them to the newly created playlist.
        let cooldownSegment = await getCooldownTracks(topTracks, topArtists);
        let cooldownURIs = [];
        for(let tracks of cooldownSegment){
            cooldownURIs.push(tracks.uri);
        }

        await spotifyAPI.addTracksToPlaylist(wkoutPlaylistID, cooldownURIs);
        console.log("Cooldown Added!");

    })().catch(e =>{
        console.error(e);
    });
}

// gets 20 songs by a given artist
async function getSongsByArtist(artist){
    const data = await spotifyAPI.searchAlbums('artist:' + artist);
    let albums = [];
    let tracks = [];

    for(var i = 0; i < data.body.albums.items.length; i++){
        albums.push({"name": data.body.albums.items[i].name, "id": data.body.albums.items[i].id, "uri": data.body.albums.items[i].uri});
    }

    for(let album in albums){
        let currAlbum = albums[album];
        const tracksdata = await spotifyAPI.getAlbum(currAlbum.id);

        for(var j = 0; j < tracksdata.body.tracks.items.length; j++){
            const track = tracksdata.body.tracks.items;
            tracks.push({"name":track[j].name, "artist":artist, "id": track[j].id, "uri":track[j].uri, "length": track[j].duration_ms});
        }
    }

    for(var tracksAnalyzed = 0; tracksAnalyzed < tracks.length; tracksAnalyzed++){
        const trackData = await spotifyAPI.getAudioAnalysisForTrack(tracks[tracksAnalyzed].id)
        const bpm = trackData.body.track.tempo;

        tracks[tracksAnalyzed].bpm = bpm;
    }

    //console.log(tracks);
     
    return tracks;
}

// creates a new playlist and returns the id
async function initializePlaylist(){
    let data = await spotifyAPI.createPlaylist("Rhythmia Playlist", {description: 'A workout playlist made by Rhythmia', public:true})
.then(
    function(data){
        console.log('Created Playlist!');
        console.log(data.body.id);
    }, 
    function(err){
        console.log('Something went wrong');
    }
)
}


// returns a playlist by a given name
async function getPlaylistByName(userName, playlistName){
    let data = await getUserPlaylists(userName);

    for(let playlist of data){
        if(playlist.name == playlistName){
            return playlist.id;
        }
    }
}

// gets the top artists of the user
async function getTopArtists(){
    const data = await spotifyAPI.getMyTopArtists();

    let artists = [];
    for(let artist_obj of data.body.items){
        const artist = artist_obj.name;
        artists.push(artist);
    }

    return artists;
}

//gets the most listened tracks of the user
async function getTopTracks(){
    const data = await spotifyAPI.getMyTopTracks({
        limit: 50
    });

    let topTracks = [];

    for(let tracks_obj of data.body.items){
        const track = tracks_obj;
        const trackData = await spotifyAPI.getAudioAnalysisForTrack(track.id)
        const bpm = trackData.body.track.tempo;

        topTracks.push({"name":track.name, "artist":track.artists[0].name, "bpm":bpm, "id": track.id, "uri":track.uri, "length": track.duration_ms});

        //console.log(track.name + " BPM: " + bpm);
    }

    return topTracks
}

// pick from the top tracks and end tracks to generate a warmup
async function getWarmupTracks(topTracks){
    let currentLength = 0;
    const MAX_LENGTH = 10*60000;
    const topTracksLength = topTracks.length;

    //console.log(MAX_LENGTH);
    // console.log(topTracksLength);

    let warmupPortion = [];

    while(currentLength <= MAX_LENGTH - 60000){
        let newSongIndex = Math.floor(Math.random() * topTracksLength);
        let newSong = topTracks[newSongIndex];

        if(newSong.bpm >= 80 && newSong.bpm <= 120){
            warmupPortion.push(newSong);
            currentLength+=newSong.length;
        }
    }
    warmupPortion.sort((a,b) => parseFloat(a.bpm) - parseFloat(b.bpm))

    return warmupPortion;
}

// pick from the top tracks and artists to generate a workout

async function getWorkoutTracks(topTracks, topArtists){
    let currentLength = 0;
    const MAX_LENGTH = 30*60000;
    const topTracksLength = topTracks.length;

    // console.log(topTracksLength);

    let workoutPortion = [];

    while(currentLength <= MAX_LENGTH){
        let pickFromTopTracks = Math.round(Math.random() * 11);
        let newSongIndex;
        let newSong;

        if(pickFromTopTracks % 2 == 0){
            newSongIndex = Math.floor(Math.random() * topTracksLength);
            newSong = topTracks[newSongIndex];

            if(newSong.bpm >= 120 && newSong.bpm <= 140){
                workoutPortion.push(newSong);
                currentLength+=newSong.length;
            }
        }

        // else{
        //     let randomTopArtistIndex = Math.floor(Math.random() * 20);
        //     let randomArtist = topArtists[randomTopArtistIndex];

        //     let rngSongs = await getSongsByArtist(randomArtist);
        //     newSong = rngSongs[Math.floor(Math.random() * rngSongs.length)];

        //     console.log(newSong);
        //     if(newSong.bpm >= 120 && newSong.bpm <= 140){
        //         workoutPortion.push(newSong);
        //         currentLength+=newSong.length;
        //     }
        // }
    }

    return workoutPortion;
}

// pick from the top tracks to generate a cooldown
async function getCooldownTracks(topTracks){
    let currentLength = 0;
    const MAX_LENGTH = 10*60000;
    const topTracksLength = topTracks.length;

    // console.log(MAX_LENGTH);
    // console.log(topTracksLength);

    let cooldownPortion = [];

    while(currentLength <= MAX_LENGTH - 60000){
        let newSongIndex = Math.floor(Math.random() * topTracksLength);
        let newSong = topTracks[newSongIndex];

        if(newSong.bpm >= 80 && newSong.bpm <= 140){
            cooldownPortion.push(newSong);
            currentLength+=newSong.length;
        }
    }
    cooldownPortion.sort((a,b) => parseFloat(b.bpm) - parseFloat(a.bpm))

    return cooldownPortion;
}

// gets the user's playlists
async function getUserPlaylists(userName){
    const data = await spotifyAPI.getUserPlaylists(userName)
    let playlists = [];

    for(let playlist of data.body.items){
        playlists.push(playlist);

        // let tracks = await getPlaylistTracks(playlist.id, playlist.name);
        // console.log(tracks);

        // const tracksJSON = {tracks}
        // let data = JSON.stringify(tracksJSON);
        // fs.writeFileSync(playlist.name +'.json', data);
    }

    return playlists;
}

// gets the songs in a playlist
async function getPlaylistTracks(playlistId, playlistName){
    const data = await spotifyAPI.getPlaylistTracks(playlistId, {
        offset: 1, 
        limit:100,
        fields: 'items'
    })

    console.log("'"+playlistName+"' contains these tracks:")
    let tracks = [];

    for(let track_obj of data.body.items){
        const track = track_obj.track;
        tracks.push(track);
        console.log(track.name + ":" + track.artists[0].name)
    }

    console.log("-----------------------");
    return tracks;
}

// gets the liked songs of the playlist
async function getLikedSongs(){
    const data = await spotifyAPI.getMySavedTracks({
        limit: 50,
        offset: 1
    })

    let likedTracks = [];

    for(let track_obj of data.body.items){
        const track = track_obj.track;
        likedTracks.push(track);
        console.log(track.name);
    }

    return likedTracks;
}

// run
createPlaylist();

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