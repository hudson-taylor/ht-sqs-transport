
"use strict";

const assert = require("assert");

const ht    = require("hudson-taylor");
const s     = require("ht-schema");
const async = require("async");

const SQSTransport = require("../lib");

describe("Hudson-Taylor SQS Transport", function() {

  let transport;

  before(function() {

    [ "ACCESS_KEY_ID", "SECRET_ACCESS_KEY", "REGION" ].forEach(function(required) {
      if(!process.env[required]) throw new Error("Environment variable " + required + " is required for running the tests.");
    });

  });

  describe("Transport", function() {

    it("should create transport instance", function() {

      transport = new SQSTransport();

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

  describe("Should work", function() {

    it("correctly", function(done) {

      var str = "hello world!";

      var transport = new SQSTransport({
        queueName: "ht-sqs-transport-test-queue"
      });

      var service = new ht.Service(transport);
      var client  = new ht.Client({
        s: transport
      });

      service.on("echo", s.String(), (data, callback) => callback(null, data));

      client.call("s", "echo", str, function(err, response) {
        assert.ifError(err);
        assert.equal(response, str);
        done();
      });

    });

  });

});
