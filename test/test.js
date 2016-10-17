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
                server.closeServer();
                done();
            });
        });
    });
        // describe("User Test", function(){
        //     it("convert to JSON", function(done){
        //         var user = new User();
        //         return {
        //             id: this.id,
        //             username: this.username,
        //             password: this.password,
        //             venmo_id: this.venmo_id,
        //         };
        //     }
        // })

});
// describe('Array', function() {
//     describe('#indexOf()', function() {
//         it('should return -1 when the value is not present', function() {
//             assert.equal(-1, [1,2,3].indexOf(4));
//         });
//     });
// });
