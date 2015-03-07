
"use strict";

const sqs  = require("sqs");
const uid2 = require("uid2");

function SQSTransportServer(config, queue) {

  let _SQSTransportServer = function(fn) {

    queue.pull(config.queueName, function(message, callback) {

      let response           = JSON.parse(message);
      let { id, name, data } = response;

      fn(name, data, function(error, data) {

        let response = {
          data,
          id,
          error
        };

        queue.push(config.queueName + "-" + id, response, callback);

      });

    });

  };

  _SQSTransportServer.prototype.listen = function(done) {
    done();
  };

  _SQSTransportServer.prototype.stop = function(done) {
    done();
  };

  return _SQSTransportServer;

}

function SQSTransportClient(config, queue) {

  let _SQSTransportClient = function() {
    this.fns = {};
  };

  _SQSTransportClient.prototype.connect = function(done) {
    done();
  };

  _SQSTransportClient.prototype.disconnect = function(done) {
    done();
  };

  _SQSTransportClient.prototype.call = function(name, data, callback) {

    let id = uid2(10);

    let request = JSON.stringify({
      name,
      data,
      id
    });

    let responseQueue = config.queueName + "-" + id;

    queue.push(config.queueName, request, function() {

      queue.pull(responseQueue, function(response) {

        let { id, error, data } = response;

        return callback(error, data);

      });

    });

  };

  return _SQSTransportClient;

}

function SQSTransport(config) {

  if(!config) { config = { aws: {} } };
  if(!config.aws) config.aws = {};

  let awsConfig = {
    access: config.aws.ACCESS_KEY_ID     || process.env.ACCESS_KEY_ID,
    secret: config.aws.SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY,
    region: config.aws.REGION            || process.env.REGION
  };

  let queue = sqs(awsConfig);

  config.queueName = config.queueName || "ht-" + Math.floor(Math.random()*1000000);

  this.Server = SQSTransportServer(config, queue);
  this.Client = SQSTransportClient(config, queue);

}

export default SQSTransport;