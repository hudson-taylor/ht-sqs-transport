
"use strict";

const assert = require("assert");

const ht = require("hudson-taylor");
const s = require("ht-schema");
const async = require("async");

const SQSTransport = require("../lib");
const findOrCreateQueue = require('../lib/findOrCreateQueue');

describe("Hudson-Taylor SQS Transport", function() {

  let transport;

  describe("Transport", function() {

    it("should create transport instance", function() {

      transport = new SQSTransport({
        region: 'ap-southeast-2',
        queueName: 'ht-queue-test-1234',
      });

      assert.equal(transport instanceof SQSTransport, true);

    });

  });

  describe("Server", function() {

    let server;

    it("should have created server", function() {
      server = new transport.Server();
      assert.equal(server instanceof transport.Server, true);
    });

    it("should provide required functions", function(done) {

      async.series([
        server.listen,
        server.stop
      ], done);

    });

  });

  describe("Client", function() {

    let client;

    it("should have created client", function() {
      client = new transport.Client();
      assert.equal(client instanceof transport.Client, true);
    });

    it("should provide required functions", function(done) {

      async.series([
        client.connect,
        client.disconnect
      ], done);

    });

  });

  describe("Queue Management", function () {
    describe("Queue exists", function () {
      let sqs;

      before(function () {
        function listQueues(params, callback) {
          callback(null, { QueueUrls: ['my-queue-url'] });
        }

        sqs = function() {
          return {
            listQueues: listQueues
          }
        }();
      });

      it("should find a queue" , function (done) {
        findOrCreateQueue(sqs, 'myQueue', function (err, queueUrl) {
          assert.equal(queueUrl, 'my-queue-url');
          done();
        });
      });
    });

    describe("Queue does not exist", function () {
      let sqs;

      before(function () {
        function listQueues(params, callback) {
          callback(null, { QueueUrls: [] });
        }

        function createQueue(params, callback) {
          callback(null, { QueueUrl: 'my-created-queue-url' });
        }

        sqs = function() {
          return {
            listQueues: listQueues,
            createQueue: createQueue
          }
        }();
      });

      it("should create a non existing queue", function (done) {
        findOrCreateQueue(sqs, 'myQueue', function (err, queueUrl) {
          assert.equal(queueUrl, 'my-created-queue-url');
          done();
        });
      });
    });
  });

  describe("Should work", function() {

    it("correctly", function(done) {

      this.timeout(20000);

      var str = "hello world!";

      var transport = new SQSTransport({
        region: 'ap-southeast-2',
        queueName: 'ht-queue-test-xyz'
      });

      var service = new ht.Service(transport);
      var client  = new ht.Client({
        s: transport
      });

      client.connect(function() {
        client.call("s", "echo", str, function(err, response) {
          assert.ifError(err);
          assert.equal(response, str);
          done();
        });
      });

      service.on("echo", s.String(), function(data, callback) {
        assert.equal({}, data)
        callback(null, data)
      });
    });

  });

});
