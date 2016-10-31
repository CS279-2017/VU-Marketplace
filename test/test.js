
var assert = require('assert');
var app = require("../app.js");
var request = require("request");
var base_url = "http://localhost:3000/"

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/mealplanappserver';


//every it function must be passed in a done

describe("User", function() {
    //NOTE: running this test wipes the users and emails databases
    describe("Registration", function(){
        it("register 26 users", function(done){
            dropDatabases(callback0);
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
                                assert(count, 26);
                                db.close();
                                done();
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

        it("registering duplicate email_addresses", function(done){
            var i = 0;
            dropDatabases(function(){
                //simultaneously registering (creates a race condition)
                app.registerEmail('aa' + "@vanderbilt.edu", callback1, error_handler);
            });

            function callback1(verification_code, email_address){
                i++;
                if(i==1){
                    printDocumentsInCollection('emails', function(){});
                    app.registerEmail('aa' + "@vanderbilt.edu", callback1, error_handler);
                }
                if(i==2){
                    printDocumentsInCollection('emails', function(){
                        getNumberOfDocumentsInCollection('emails', function(count){
                            console.log("Number of emails in emails db: " + count);
                            assert(count, 1);
                            done();
                        });
                    })
                }
            }
            function error_handler(error){
                console.log(error);
            }
        })

        //since adding unique indexes
        it("registering username that's been taken", function(done){
            dropDatabases(function(){
                //simultaneously registering (creates a race condition)
                app.registerEmail('aa' + "@vanderbilt.edu", callback1, error_handler);
                app.registerEmail('ab' + "@vanderbilt.edu", callback1, error_handler);

            })

            function callback1(verification_code, email_address){
                console.log("callback1 called on " + email_address)
                var username = 'helloooo';
                // console.log("calling registerVerificationCode");
                app.registerVerificationCode(verification_code, username , "chocho513", "chocho513", email_address, callback2, error_handler);
            }
            function callback2(message) {
                console.log("callback2 called");
                console.log(message);
            }
            function error_handler(error){
                console.log(error);
                assert(error, "helloooo has been taken");
                done();
            }

        });
        
        // it("is valid email", function(){
        //     //TODO: write some methods to test the email validation code
        // });
        // it("is vanderbilt email", function(){
        //    //TODO: write osme methods to test the vanderbilt validation code
        // });
        //
        // it("is valid username", function(){
        //   //TODO: write some methods to test user name validation
        // });
        // it("is valid password", function(){
        //     //TODO: write some methods to test password validation
        // });
    });

    describe("Login", function(done){
        function error_handler(error_msg){
            console.log(error_msg);
        }
        it("register 26 then login", function(done){
                this.timeout(5000);
            dropDatabases(callback0);
            function callback0(){
                var push_strings = []; //push strings onto here after popping off of possible_strings;
                var possible_strings = getAllPossibleStrings(1);
                var i = 0;
                var users = [];
                function callback1(verification_code, email_address){
                    var username = possible_strings.pop();
                    push_strings.push(username);
                    // console.log("calling registerVerificationCode");
                    app.registerVerificationCode(verification_code, username + '6666666', "chocho513", "chocho513", email_address, callback2, error_handler);
                }
                function callback2(username, password) {
                    // users.push({username: username, password: password, email_address: email_address});
                    console.log("attempting to login as " + username + " with password " + password);
                    app.login(username, password, callback, error_handler);
                    function callback() {
                        i++;
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

        it("register then login then logout then login", function(done){
            dropDatabases(callback0);
            function callback0(){
                app.registerEmail( "bowen.leeroy@vanderbilt.edu", callback1, error_handler);
                function callback1(verification_code, email_address){
                    console.log("registering bowenjin with verification code " + verification_code);
                    app.registerVerificationCode(verification_code, 'bowenjin', "chocho513", "chocho513", email_address, callback2, error_handler);
                }
                function callback2(username, password) {
                    // users.push({username: username, password: password, email_address: email_address});
                    console.log("attempting to login as " + username + " with password " + password);
                    app.login(username, password, callback3, error_handler);
                    function callback3(_id) {
                        app.getActiveUsers().get(_id).setVenmoId("some_venmo_id");
                        app.logout(_id, password, function(){
                            console.log(app.getActiveUsers());
                            app.login(username, password, function(_id){
                                assert(app.getActiveUsers().get(_id).venmo_id == "some_venmo_id");
                                done();
                            }, error_handler)

                        }, error_handler)
                    }
                }
            }

        });
    });
});

describe("Listing", function(){
    describe("Make Listing", function(){


        it("make 26 listings, 1 for each user", function (done) {
            register26EmailAddressesAndLogin(function() {
                console.log("make 26 listings");
                make26Listings();
            });
            function make26Listings(){
                            var j = 0;
                            var active_users = app.getActiveUsers()
                            var all_users = active_users.getAll();
                            // console.log("active_users: ");
                            // console.log(active_users);
                            // console.log("all_users: ");
                            // console.log(all_users);
                            for (var i in all_users) {
                                var user = all_users[i];
                                console.log("_id: "+ user._id + " password: " + user.password);
                                app.makeListing(user._id, user.password, "some title", "some description", "some location", 123456, 5.00, true, callback, error_handler)
                            }
                            function callback() {
                                j++;
                                console.log("listing j = " + j);
                                if (j == 26){
                                    console.log("print activeListings");
                        var active_listings = app.getActiveListings();
                        assert(active_listings.size(), 26);
                        done();
                    }
                };
            }
        });
        
        it("make 26 listings, 1 for each user then delete 13", function(done){
            console.log("register 26 email addresses called");
            register26EmailAddressesAndLogin(function() {
                console.log("make 26 listings called");
                make26Listings();
            });
            function make26Listings(){
                var z = 0;
                var active_users = app.getActiveUsers()
                var all_users = active_users.getAll();
                // console.log("active_users: ");
                // console.log(active_users);
                // console.log("all_users: ");
                // console.log(all_users);
                for (var index in all_users) {
                    console.log("all users lenght: " + all_users.length);
                    var user = all_users[index];
                    app.makeListing(user._id, user.password, "some title", "some description", "some location", 123456, 5.00, true, callback, error_handler)
                }
                function callback() {
                    console.log("callback inside 'make 26 listings, 1 for each user then delete 13'")
                    z++;
                    console.log("listing z = " + z);
                    if (z == 26){
                        console.log("print activeListings");
                        var active_listings = app.getActiveListings();
                        assert(active_listings.size(), 26);
                        delete13Listings(function(){
                            console.log("delete13Listings callback inside 'make 26 listings, 1 for each user then delete 13'");
                            assert(active_listings.size(), 13);
                            var listing_count = 0;
                            for(var user_id in active_users){
                                if(active_users[user_id].getCurrentListingsIds().length == 1){
                                    listing_count++;
                                }
                                console.log("active_users: ");
                                console.log(active_users);
                            }
                            assert(listing_count, 13);
                            done();
                        });

                    }
                };

                function delete13Listings(callback){
                    var all_listings = app.getActiveListings();
                    for (var i in all_listings) {
                        var listing = all_listings[i];
                        app.removeListing(listing.user_id, active_users.get(listing.user_id).password, listing._id, callback, error_handler);
                    }
                }
            }
        });


    });
    function error_handler(error){
        console.log(error);
    }
});

describe("Transaction", function(){
    describe("initiateTransaction", function(){
        // it("register 2 user/login both/user 1 makes listing/user 2 makes transaction/user 1 accepts transaction", function(){
        //
        // });
        //
        // it("register 2 user/ login both/ user 1 makes listing/ user 1 makes transaction/ throw error, can't accept own transaction", function(){
        //
        // });
        //
        // it("register 2 user/ login both/ user 1 makes listing/ user 1 logs out/ user 2 makes transaction/ user 1 gets notification/" +
        //     " after a certain amount of time transaction request is closed", function(){
        //
        // });
        // it("register 3 user/ login all 3/ user 1 makes listing/ user 2 makes transaction/ user 1 accept/ user 3 attempts to make transaction/" +
        //     "throw error", function(){
        //
        // });



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

function dropDatabases(callback, error_handler){
    console.log("dropDatabases called");
    MongoClient.connect(url, function (err, db) {
        if (err) {
            error_handler('Unable to connect to the mongoDB server. Error:' +  err);
            return;
        }
        var collection = db.collection('users');
        collection.drop(null, function(){
            var collection = db.collection('emails');
            collection.drop(null, function(){
                var collection = db.collection('listings');
                collection.drop(null, function(){
                    var collection = db.collection('transactions');
                    collection.drop(null, function(){
                        var active_users = app.getActiveUsers();
                        var active_listings = app.getActiveListings();
                        var active_transactions = app.getActiveTransactions();
                        active_listings.clear();
                        active_transactions.clear();
                        active_users.clear();
                        callback();
                    })
                })
            });
        });
    });
}

function getNumberOfDocumentsInCollection(collection_name, callback){
    MongoClient.connect(url, function (err, db) {
        if (err) {
            error_handler('Unable to connect to the mongoDB server. Error:' +  err);
            return;
        }
        var collection = db.collection(collection_name);
        collection.find().count(function(error, count){
            callback(count);
        });
    });
}

function printDocumentsInCollection(collection_name, callback){
    MongoClient.connect(url, function (err, db) {
        if (err) {
            error_handler('Unable to connect to the mongoDB server. Error:' +  err);
            return;
        }
        var collection = db.collection(collection_name);
        collection.find().toArray(function(err, docs){
            console.log(docs);
            callback();
        });
    });
}

function register26EmailAddressesAndLogin(callback){
    console.log("register26EmailAddressesAndLogin called");
    dropDatabases(callback0, error_handler);
        function callback0(){
            console.log("dropDatabases callback0 called")
            var push_strings = []; //push strings onto here after popping off of possible_strings;
            var possible_strings = getAllPossibleStrings(1);
            var i = 0;
            var users = [];
            for(var string in possible_strings){
                app.registerEmail(string + "@vanderbilt.edu", callback1, error_handler);
            }
            
            function callback1(verification_code, email_address){
                var username = possible_strings.pop();
                push_strings.push(username);
                // console.log("calling registerVerificationCode");
                app.registerVerificationCode(verification_code, username + '6666666', "chocho513", "chocho513", email_address, callback2, error_handler);
            }
            function callback2(username, password) {
                // users.push({username: username, password: password, email_address: email_address});
                console.log("attempting to login as " + username + " with password " + password);
                app.login(username, password, callback3, error_handler);
            }
            function callback3(){
                i++;
                console.log("callback3 called i value is " + i);
                if(i == 25){
                    console.log("callback called");
                    callback();
                }
            }
            function error_handler(error){
                console.log(error);
            }
        }
}

function error_handler(err){
    console.log(err)
}

// describe('Array', function() {
//     describe('#indexOf()', function() {
//         it('should return -1 when the value is not present', function() {
//             assert.equal(-1, [1,2,3].indexOf(4));
//         });
//     });
// });
