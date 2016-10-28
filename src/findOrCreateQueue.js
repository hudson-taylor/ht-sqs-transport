function findQueue(sqs, queueName, callback) {
  var params = {
    QueueNamePrefix: queueName
  };
  sqs.listQueues(params, function(err, data) {
    if (err) {
      return callback(err)
    }

    if (data.QueueUrls && data.QueueUrls.length > 0) {
      callback(null, data.QueueUrls[0])
    } else {
      callback()
    }
  });
}

function createQueue(sqs, queueName, callback) {
  var params = {
    QueueName: queueName
  };
  sqs.createQueue(params, function(err, data) {
    if (err) {
      return callback(err)
    }

    return callback(null, data.QueueUrl)
  });
}

function findOrCreateQueue(sqs, queueName, callback) {
  findQueue(sqs, queueName, function (err, queueUrl) {
    if (err) {
      return callback(err)
    }

    if (queueUrl) {
      return callback(null, queueUrl)
    }

    createQueue(sqs, queueName, callback)
  })
}

export default findOrCreateQueue;
