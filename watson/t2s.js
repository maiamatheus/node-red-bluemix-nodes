/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
  var cfenv = require('cfenv');

  var username, password;

  var service = cfenv.getAppEnv().getServiceCreds(/text to speech/i)

  if (service) {
    username = service.username;
    password = service.password;
  }

  RED.httpAdmin.get('/watson-text-to-speech/vcap', function(req, res) {
    res.json(service ? {bound_service: true} : null);
  });

  function Node(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    var toArray = require('stream-to-array')

    this.on('input', function(msg) {
      if (!msg.payload) {
        node.error('Missing property: msg.payload');
        return;
      }

      username = username || this.credentials.username;
      password = password || this.credentials.password;

      if (!username || !password) {
        node.error('Missing Speech To Text service credentials');
        return;
      }

      var watson = require('watson-developer-cloud');

      var text_to_speech = watson.text_to_speech({
        username: username,
        password: password,
        version: 'v1',
        url: 'https://stream.watsonplatform.net/text-to-speech/api'
      });

      var params = {
        text: msg.payload,
        voice: config.voice,
        accept: 'audio/wav'
      };

      text_to_speech.synthesize(params, function (err, body, response) {
        if (err) {
          node.error(err);
        } else {
          msg.speech = body;
        }
        node.send(msg);
      })
    })
  }
  RED.nodes.registerType("watson-text-to-speech", Node, {
    credentials: {
      username: {type:"text"},
      password: {type:"password"}
    }
  });
};
