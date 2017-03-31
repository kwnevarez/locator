// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Sample of web sockets for Google App Engine
// https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/appengine/websockets

'use strict';
const http = require('http');
const request = require('request');

const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({
    extended: false
})

const Particle = require('particle-api-js');
const particle = new Particle();
var token = null;

var websocket;
const ws_port = '50051'; // https://cloud.google.com/shell/docs/limitations#outgoing_connections
const ws_route = '/ws';

const map_api_key = 'AIzaSyA-x28fy_HdNt3dpkH6nqHQDOgzqBNEBUA';

// In order to use websockets on App Engine, you need to connect directly to
// application instance using the instance's public external IP. This IP can
// be obtained from the metadata server.
const METADATA_NETWORK_INTERFACE_URL = 'http://metadata/computeMetadata/v1/' +
    '/instance/network-interfaces/0/access-configs/0/external-ip';

function get_external_ip(cb) {
    const options = {
        url: METADATA_NETWORK_INTERFACE_URL,
        headers: {
            'Metadata-Flavor': 'Google'
        }
    };

    request(options, (err, resp, body) => {
        if (err || resp.statusCode !== 200) {
            console.log('Error while talking to metadata server, assuming localhost');
            cb('localhost');
            return;
        }
        cb(body);
    });
}

// our websocket setup
app.ws(ws_route, (ws) => {
    // simply grab the websocket and store so we can call it at a later time
    // no need for event handling since the client should never be sending 
    // messages our way 
    websocket = ws;

    ws.on('open', function(msg) {
        console.log('websocket open');
    });
    ws.on('close', function(msg) {
        console.log('websocket close');
    });
    ws.on('err', function(msg) {
        console.log('websocket error');
    });
    ws.on('message', function(msg) {
        console.log('websocket msg: ' + JSON.stringify(msg));
    });
});

// default page leads you to login
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render("login.ejs");
});

// logs into particle then set up the event listener
app.post('/login', urlencodedParser, function(req, res) {
    console.log('Logging in');
    particle.login({
        username: req.body.username,
        password: req.body.password
    }).then(function(data) {
            console.log('logged in. Getting event stream');
            token = data.body.access_token;
            //Get your devices events
            particle.getEventStream({
                deviceId: 'mine',
                auth: token
            }).then(function(stream) {
                    console.log('Got event stream.');
                    stream.on('event', function(data) {
                        console.log('Event: ' + JSON.stringify(data));
                        // this is the event handler for particle events
                        // make sure we are only looking at the deviceLocator events
                        if (data.name.startsWith("hook-response/deviceLocator")) {
                            var a = data.data.split(",");
                            // convert strings to numbers: lat, lng, accuracy
                            a[0] = parseFloat(a[0]);
                            a[1] = parseFloat(a[1]);
                            a[2] = parseInt(a[2]);
                            // get he device id from the name of the event
                            var device_id = data.name.split("/")[2];
                            // send the event to the client
                            var msg = JSON.stringify({
                                id: device_id,
                                pub: data.published_at,
                                pos: {
                                    lat: a[0],
                                    lng: a[1],
                                },
                                acc: a[2]
                            });
                            websocket.send(msg);
                            console.log(msg);
                        }
                    });
                },
                function(err) {
                    console.log('Could not get stream.');
                    res.send('Get stream failed, please try again.' + err.shortErrorDescription);
                }
            );
            // setup the redirect to the map page
            res.redirect('/map');
        },
        function(err) {
            console.log('Could not log in. ' + err.shortErrorDescription);
            res.send('Login failed, please try again. ' + err.shortErrorDescription);
        }
    );

})

// you have to be logged in to get the map page
app.use('/map', function(req, res, next) {
    console.log('Logged in?', req.originalUrl);
    // if we have not logged in, redirect to the login page
    if (token === null) {
        console.log('Nope, redirect to login');
        res.redirect('/login');
    } else {
        console.log('Yep, proceed');
        next();
    }  
});

// render the map page with relevent ip and websocket information
app.get('/map', (req, res) => {    
    // render the map page
    get_external_ip((external_ip) => {
        console.log('External IP: ' + external_ip);
        res.render("map.ejs", {
            external_ip: external_ip,
            ws_port: ws_port,
            ws_route: ws_route,
            map_api_key: map_api_key
        });

    });
});

// fake an event for testing purposes
app.get('/event', (req, res) => {
    websocket.send(JSON.stringify({
        id: '32001a001147343339383037',
        pub: '2017-03-30T05:00:46.167Z',
        pos: {
            lat: 39.043756699999996,
            lng: -77.4874416
        },
        acc: 3439
    }));
    res.send('Event!!');
});

// see what the external ip address is
app.get('/ip', (req, res) => {
    get_external_ip((external_ip) => {
        console.log('External IP: ' + external_ip);
        res.send(externalIp);
    });
});

// lauch our servers
if (module === require.main) {
    // Start the websocket server
    const wsServer = app.listen(ws_port, () => {
        console.log('Websocket server listening on port %s', wsServer.address().port);
    });
    // Additionally listen for non-websocket connections on the default App Engine
    // port 8080. Using http.createServer will skip express-ws's logic to upgrade
    // websocket connections.
    const PORT = process.env.PORT || 8080;
    http.createServer(app).listen(PORT, () => {
        console.log(`App listening on port ${PORT}`);
        console.log('Press Ctrl+C to quit.');
    });
}

module.exports = app;
