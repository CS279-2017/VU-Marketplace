
var assert = require('assert');
var app = require("../app.js");
var request = require("request");
var base_url = "http://localhost:3000/"

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/mealplanappserver';




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

    //NOTE: running this test wipes the users and emails databases
    describe("Registration", function(){
        it("register 26 users", function(done){
            dropUsersAndEmailsDatabase(callback0);
            function callback0(){
                var possible_strings = getAllPossibleStrings(1);
                var i = 0;
                function callback1(verification_code, email_address){
                    var username = possible_strings.pop();
                    // console.log("calling registerVerificationCode");
                    app.registerVerificationCode(verification_code, username + '6666666', "chocho513", "chocho513", email_address, callback2, error_handler);
                }
                function callback2(message) {
                    // console.log(message);
                    i++;
                    if(i == 26){
                        MongoClient.connect(url, function (err, db) {
                            if (err) {
                                error_handler('Unable to connect to the mongoDB server. Error:' +  err);
                                return;
                            }
                            var collection = db.collection('users');
                            collection.count(null,null,function(err, count){
                                if(err){ error_handler(err); return;}
                                dropUsersAndEmailsDatabase(function(){
                                    assert(count, 26);
                                    db.close();
                                    done();
                                });
                            });

                        });
                    }
                }
                function error_handler(error){
                    console.log(error);
                }
                for(var string in possible_strings){
                    app.registerEmail(string + "@vanderbilt.edu", callback1, error_handler);
                }
            }
           
        });
        
        it("registering username that's been taken", function(done){
            dropUsersAndEmailsDatabase(function(){
                app.registerEmail('aa' + "@vanderbilt.edu", callback1, error_handler);
                app.registerEmail('ab' + "@vanderbilt.edu", callback1, error_handler);
            })

            function callback1(verification_code, email_address){
                var username = 'helloooo';
                // console.log("calling registerVerificationCode");
                app.registerVerificationCode(verification_code, username , "chocho513", "chocho513", email_address, callback2, error_handler);
            }
            function callback2(message) {
                console.log(message);
            }
            function error_handler(error){
                assert(error, "username has been taken");
                done();
            }

        });
        
        it("is valid email", function(){
            //TODO: write some methods to test the email validation code
        });
        it("is vanderbilt email", function(){
           //TODO: write osme methods to test the vanderbilt validation code
        });

        it("is valid username", function(){
          //TODO: write some methods to test user name validation
        });
        it("is valid password", function(){
            //TODO: write some methods to test password validation
        });
    });

    describe("Login", function(done){
        it("register 26 then login", function(done){
            dropUsersAndEmailsDatabase(callback0);
            function callback0(){
                var push_strings = []; //push strings onto here after popping off of possible_strings;
                var possible_strings = getAllPossibleStrings(1);
                var i = 0;
                function callback1(verification_code, email_address){
                    var username = possible_strings.pop();
                    push_strings.push(username);
                    // console.log("calling registerVerificationCode");
                    app.registerVerificationCode(verification_code, username + '6666666', "chocho513", "chocho513", email_address, callback2, error_handler);
                }
                function callback2(message) {
                    // console.log(message);
                    i++;
                    app.login(username, "chocho513", callback, error_handler);
                    function callback() {
                        if(i == 26){
                            console.log(app.getActiveUsers());
                            done();
                        }
                    }
                    
                }
                function error_handler(error){
                    console.log(error);
                }
                for(var string in possible_strings){
                    app.registerEmail(string + "@vanderbilt.edu", callback1, error_handler);
                }
            }

        });
    });

});

function getAllPossibleStrings(length){
    var possibleStrings = [];
    recursive("", length);
    return possibleStrings;
    function recursive(string, length){
        if(length == 0){
            possibleStrings.push(string);
        }
        else {
            for (var i = 'a'; i <= 'z'; i = nextChar(i)) {
                recursive(string + i, length - 1);
            }
        }
    }
    function nextChar(c) {
        return String.fromCharCode(c.charCodeAt(0) + 1);
    }
}

function dropUsersAndEmailsDatabase(callback){
    MongoClient.connect(url, function (err, db) {
        if (err) {
            error_handler('Unable to connect to the mongoDB server. Error:' +  err);
            return;
        }
        var collection = db.collection('users');
        collection.drop(null, function(){
            var collection = db.collection('emails');
            collection.drop(null, function(){
                callback();
            });
        });
    });
}

// describe('Array', function() {
//     describe('#indexOf()', function() {
//         it('should return -1 when the value is not present', function() {
//             assert.equal(-1, [1,2,3].indexOf(4));
//         });
//     });
// });
