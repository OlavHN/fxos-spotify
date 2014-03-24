var Spotify = require('spotify-web');

var url = require('url');
var http = require('http');

var spotify;
Spotify.login(process.env.USERNAME, process.env.PASSWORD, function (err, res) {
  if (err) throw err;
  spotify = res;
});

http.createServer(function(request, response) {
  var url_parts = url.parse(request.url);

  switch(url_parts.pathname.split('/')[1]) {
    case 'track':
      var uri = url_parts.pathname.split('/')[2];
      console.log('fetching', uri);
      getSong(spotify, uri, function(stream) {
        response.writeHead(200, {
          'Content-Type': 'audio/mpeg'
        });
        stream.pipe(response);
      });
      break;
    case 'data':
      getPlaylistsData(spotify, function(results) {
        response.writeHead(200, {
          'Content-Type': 'application/json'
        });
        response.end(JSON.stringify(results));
      });
      break;
    default:
      response.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      response.end('Hello world!');
  }
}).listen(3000);

function getPlaylistsData(spotify, callback) {
  spotify.rootlist(function(err, rootlist) {
    var playlists = rootlist.contents.items.filter(function(list) {
      return list.uri.indexOf('playlist') !== -1;
    });
    forEach(playlists, function(list, cb) {
      spotify.playlist(list.uri, function(err, listData) {
        if (err) console.log(err);
        cb({
          uri: list.uri,
          name: listData.attributes.name,
          tracks: listData.contents.items.map(function(item) {return item.uri})
        });
      });
    }, function(results) {
      callback(results.map(function(result) { return result[0]; }));
    });
  });
}

function getSong(spotify, uri, callback) {
  spotify.get(uri, function(err, track) {
    if (err) console.log(err);
    callback(track.play());
  });
}

/** Helper for async operations */
function forEach(list, func, cb) {
  var result = [];
  var remaining = list.length;
  list.forEach(function(item, i) {
    func(item, function() {
      result[i] = [].slice.call(arguments);
      remaining--;
      if (!remaining)
        cb(result);
    });
  });
}
