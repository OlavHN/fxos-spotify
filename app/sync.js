var music = navigator.getDeviceStorage('music');

module.exports = function sync(endpoint) {
  return {
    sdCardGet: function(uri, callback) {
      var name = 'spotify_' + uri.split(':').pop() + '.mp3';
      var req = music.get(name);
      req.onsuccess = function() {
        if (this.restult)
          callback(null, this.result);
        else
          callback('NotFound');
      };
      req.onerror = function() {
        callback('NotFound', this.error);
      };
    },
    sdCardPut: function(uri, blob, callback) {
      var name = 'spotify_' + uri.split(':').pop() + '.mp3'
      var req = music.addNamed(blob, name);
      req.onsuccess = function() {
        callback(null, this.result);
      };
      req.onerror = function() {
        callback(this.error || 'error');
      };
    },
    spotifyGet: function(uri, callback) {
      var req = new XMLHttpRequest({mozSystem: true});
      req.open('get', endpoint + '/track/' + uri, true);
      console.log(endpoint + '/track/' + uri);
      req.responseType = 'blob';
      req.onload = function() {
        if (req.status === 200)
          callback(null, req.response);
        else
          callback(req.status);
      };
      req.onerror = function() {
        console.log(req);
        callback('NetworkError');
      };
      req.send();
    },
    sync: function(uri, callback) {
      var self = this;
      this.sdCardGet(uri, function(err, res) {
        console.log(arguments);
        if (err && err === 'NotFound')
          self.spotifyGet(uri, function(err, file) {
            console.log(file);
            self.sdCardPut(uri, file, callback);
          });
        else
          callback();
      });
    },
    verifyState: function(lists, callback) {
      console.log(lists);
      var cursor = music.enumerate();
      cursor.onsuccess = function() {
        var file = this.result;
        if (file.name.split('/').pop())
        console.log(file);
        if (this.done)
          cursor.continue();
      };
    }
  };
};
