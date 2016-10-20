// var request = require("request");
// var assert = require('assert');
// var base_url = "http://localhost:3000/"



// describe("GET /", function() {
//     it("returns status code 200", function() {
//         request.get(base_url, function(error, response, body) {
//
//             assert.equal(200, response.statusCode);
//             done();
//             server.closeServer();
//         });
//     });
// });

// describe("testing the User object", function(){
//
// });

// var request = require("request"),
//     assert = require('assert'),
//     helloWorld = require("../app.js"),
//     base_url = "http://localhost:3000/";
//
// var server = require("../app.js"),
//
//


var assert = require('assert');
var server = require("../app.js");
var request = require("request");
var base_url = "http://localhost:3000/"
// var mongodb = require('mongodb');
//
//
//



describe("Hello World Server", function() {
    describe("GET /", function() {
        it("returns status code 200", function(done) {
            request.get(base_url, function(error, response, body) {
                //expect(response.statusCode).toBe(200);
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it("returns Hello World", function(done) {
            request.get(base_url, function(error, response, body) {
                //expect(body).toBe("Hello World");
                assert.equal("Hello World!", body);
                done();
            });
        });
    });
    describe("Registration", function(){
        it("send registration email", function(done){
            // var json = '{"email_address": "bowen.jin@vanderbilt.edu"}';
            // request.post({
            //     headers: {'content-type' : 'application/x-www-form-urlencoded'},
            //     url:     base_url,
            //     body:    "command=register&json="+json,
            //
            // }, function(error, response, body){
            //     done();
            // });
        });
        
        it("SQL injection test", function(done){
            //TODO: write a test to protect against SQL injection
        });
        
        it("invalid username/password", function(){
            //TODO: write a test to ensure invalid username/password is caught and communicated to client
        });
        
        it("invalid email", function(){
           //TODO: test to make sure that an invalid email is caught 
        });
    });

});
// describe('Array', function() {
//     describe('#indexOf()', function() {
//         it('should return -1 when the value is not present', function() {
//             assert.equal(-1, [1,2,3].indexOf(4));
//         });
//     });
// });
