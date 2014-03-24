/** @jsx React.DOM */

var React = require('react');
var request = require('browser-request');
var sync = require('./sync')('http://10.0.0.40:3000');

var Foxify = React.createClass({
  getInitialState: function() {
    return {
      playlists: JSON.parse(localStorage.getItem('playlists')) || []
    };
  },
  componentWillMount: function() {
    this.fetchData();
  },
  fetchData: function() {
    var req = new XMLHttpRequest({mozSystem: true});
    req.open('get', this.props.endpoint + '/data', true);
    req.responseType = 'json';
    var self = this;
    req.onload = function() {
      // 1. Map checked playlists with the stored ones
      // 2. Make sure any new songs are synced
      // 3. make sure any old songs are deleted
      if (req.status === 200) {
        var playlists = req.response;
        var self = this;
        self.setState({playlists: req.response});
        localStorage.setItem('playlists', JSON.stringify(req.response));
        self.checkSyncStatus();
      }
      else
        console.error(req.status, req);
    };
    req.onerror = function() {
      console.error('NetworkErr', req);
    };
    req.send();
  },
  checkSyncStatus: function() {
    var tracks = this.state.playlists.reduce(function(tracks, playlist) {
      playlist.tracks.forEach(function(track) {
        tracks[track] = true;
      });
      return tracks;
    }, {});
    sync.verifyState(tracks, console.log.bind(console));
  },
  render: function() {
    var lists = this.state.playlists.map(function(list) {
      return <Playlist data={list} />
    });
    return (
      <div>
        {lists}
      </div>
    );
  }
});

var Playlist = React.createClass({
  syncAll: function syncAll(uris, callback) {
    var trackUri = uris.pop();
    if (trackUri)
      sync.sync(trackUri, function() {
        syncAll(uris, callback);
      });
    else callback();
  },
  handleClick: function() {
    var tracks = this.props.data.tracks.slice();
    console.log(tracks);
    this.syncAll(tracks, function() {
      console.log('done syncing');
    });
  },
  render: function() {
    return (
      <div onClick={this.handleClick}>
        {this.props.data.name} - {this.props.data.tracks.length} songs
      </div>
    );
  }
});

React.renderComponent(
  <Foxify endpoint={'http://10.0.0.40:3000'} />,
  document.getElementById('foxify')
);
