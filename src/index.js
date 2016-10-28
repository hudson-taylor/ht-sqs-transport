const AWS = require('aws-sdk');
const uid2 = require('uid2');
const SqsConsumer = require('sqs-consumer');
const findOrCreateQueue = require('./findOrCreateQueue')

function SQSTransportServer(config, sqs) {
  let consumer;

  let _SQSTransportServer = function(fn) {
    this.fn = fn;
  };

  _SQSTransportServer.prototype.listen = function(done) {
    findOrCreateQueue(sqs, config.queueName, function(err, queueUrl) {
      consumer = SqsConsumer.create({
        queueUrl: queueUrl,
        handleMessage: function (message, done) {
          console.log(message)
          done();
        }
      });

      consumer.on('error', function (err) {
        console.log(err.message);
      });

      consumer.start();
      done();
    })
  };

  _SQSTransportServer.prototype.stop = function(done) {
    consumer.stop();
    done();
  };

  return _SQSTransportServer;

}

function SQSTransportClient(config, queue) {

  function _SQSTransportClient() {
    this.fns = {};
  };

  _SQSTransportClient.prototype.connect = function(done) {
    findOrCreateQueue(queue, config.queueName, function (err, queueUrl) {
      config.queueUrl = queueUrl;
      done(err)
    });
  }

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

    let params = {
      MessageBody: request,
      QueueUrl: config.queueUrl
    };

    queue.sendMessage(params, function(err, response) {
      return callback(err, data)
    });
  }

  return _SQSTransportClient;

}

function SQSTransport(config) {
  AWS.config.update({region: config.region});
  let queue = new AWS.SQS();

  this.Server = SQSTransportServer(config, queue);
  this.Client = new SQSTransportClient(config, queue);
}

export default SQSTransport;
