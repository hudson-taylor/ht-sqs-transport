const AWS = require('aws-sdk');
const uid2 = require("uid2");

function SQSTransportServer(config, queue) {

  let _SQSTransportServer = function(fn) {
    var params = {
      AttributeNames: [ "All" ],
      VisibilityTimeout: config.visibilityTimeout,
      MaxNumberOfMessages: 1,
      QueueUrl: config.queueUrl,
      WaitTimeSeconds: 20
    };

    queue.receiveMessage(params, function(err, response) {
      if (err) {
        console.log(err)
        return
      }

      if (response.Messages) {
        let message = response.Messages[0];

        let { id, name, data } = JSON.parse(message.Body);

        fn(name, data, function(error, data) {
          if (error) {
            // don't delete the message if there was an error in processing
            return
          }

          var params = {
            QueueUrl: config.queueUrl,
            ReceiptHandle: message.ReceiptHandle
          };

          queue.deleteMessage(params, function(err, data) {
            if (err) {
              console.log(err)
            }
          });
        });
      }
    })
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

    let params = {
      MessageBody: request,
      QueueUrl: config.queueUrl
    };

    queue.sendMessage(params, function(err, data) {
        return callback(err, data)
    });
  };

  return _SQSTransportClient;

}

function SQSTransport(config) {
  AWS.config.update({region: config.region});
  let queue = new AWS.SQS();

  this.Server = SQSTransportServer(config, queue);
  this.Client = SQSTransportClient(config, queue);
}

export default SQSTransport;
