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



function getQueueARN(sqs, queueUrl, callback) {
  var params = {
    AttributeNames: [
      'QueueArn'
    ],
    QueueUrl: queueUrl
 };

 sqs.getQueueAttributes(params, function(err, data) {
   if (err) {
     return callback(err);
   }

   return callback(null, data.Attributes.QueueArn)
 });
}

function createDeadLetterQueue(sqs, queueName, callback) {
  createQueue(sqs, queueName + "-dead", function (err, queueUrl) {
    if (err) {
      return callback(err);
    }

    getQueueARN(sqs, queueUrl, function (err, queueArn) {
      if (err) {
        return callback(err);
      }

      callback(null, queueArn)
    });
  });
}

function createQueueWithRedrivePolicy(sqs, queueName, deadQueueArn, maxReceiveCount, callback) {
  var params = {
    Attributes: {
      'RedrivePolicy': '{"deadLetterTargetArn":"' + deadQueueArn + '","maxReceiveCount":"' + maxReceiveCount + '"}'
    },
    QueueName: queueName
  }

  sqs.createQueue(params, function(err, data) {
    if (err) {
      return callback(err)
    }

    return callback(null, data.QueueUrl)
  });
}

function createQueue(sqs, queueName, callback) {
  var params = {
    QueueName: queueName
  }

  sqs.createQueue(params, function(err, data) {
    if (err) {
      return callback(err)
    }

    return callback(null, data.QueueUrl)
  });
}

function findOrCreateQueue(sqs, queueName, maxReceiveCount, callback) {
  findQueue(sqs, queueName, function (err, queueUrl) {
    if (err) {
      return callback(err)
    }

    if (queueUrl) {
      return callback(null, queueUrl)
    }

    if (maxReceiveCount) {
      createDeadLetterQueue(sqs, queueName, function (err, queueArn) {
        if (err) {
          return callback(err);
        }

        return createQueueWithRedrivePolicy(sqs, queueName, queueArn, maxReceiveCount, callback);
      });
    } else {
      return createQueue(sqs, queueName, callback);
    }
  })
}

export default findOrCreateQueue;
