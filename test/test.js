var assert = require('assert');
var app = require("../app.js");
var request = require("request");
var base_url = "http://localhost:3000/"

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/mealplanappserver';


function error_handler(error){
    console.log(error);
}

//1. a listing gets mutliple transactions and the users accepts multiple of them in quick succession, make sure only 1
//gets accepted and once that one is accepted, the others get deleted
//TODO: 2. make sure a listing is deleted from active_listings at some point after it is expired
//TODO: 3. try to make a transaction from an expired listing

describe.skip("User", function() {
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
                    if(i == 25){
                        MongoClient.connect(url, function (err, db) {
                            if (err) {
                                error_handler('Unable to connect to the mongoDB server. Error:' +  err);
                                return;
                            }
                            var collection = db.collection('users');
                            collection.count(null,null,function(err, count){
                                if(err){ error_handler(err); return;}
                                assert(count == 26);
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
                            assert(count == 1);
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
        //    //TODO: write some methods to test the vanderbilt validation code
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
                        if(i == 25){
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
                    function callback3(user) {
                        console.log("login callback:")
                        console.log(user)
                        var _id = user._id
                        var active_users = app.getActiveUsers();
                        (active_users.get(_id)).setVenmoId("some_venmo_id");
                        app.logout(_id, password, function(){
                            console.log(app.getActiveUsers());
                            app.login(username, password, function(user){
                                assert(app.getActiveUsers().get(user._id).venmo_id == "some_venmo_id");
                                done();
                            }, error_handler)

                        }, error_handler)
                    }
                }
            }

        });
    });
});

describe.skip("Listing", function(){
    describe("Make Listing", function(){


        // it("make 26 listings, 1 for each user", function (done) {
        //     register26EmailAddressesAndLogin(function() {
        //         console.log("make 26 listings");
        //         make26Listings();
        //     });
        //     function make26Listings(){
        //         var j = 0;
        //         var active_users = app.getActiveUsers()
        //         var all_users = active_users.getAll();
        //         // console.log("active_users: ");
        //         // console.log(active_users);
        //         // console.log("all_users: ");
        //         // console.log(all_users);
        //         for (var i in all_users) {
        //             var user = all_users[i];
        //             console.log("_id: "+ user._id + " password: " + user.password);
        //             app.makeListing(user._id, user.password, "some title", "some description", "some location", 123456, 5.00, true, callback, error_handler)
        //         }
        //         function callback() {
        //             j++;
        //             console.log("listing j = " + j);
        //             if (j == 25) {
        //                 console.log("print activeListings");
        //                 var active_listings = app.getActiveListings();
        //                 assert(active_listings.size(), 26);
        //                 done();
        //             }
        //         }
        //     };
        // });

        //TODO: this test sometimes passes sometimes doesn't, gets stuck on z = 25
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
                    console.log("all users length: " + all_users.length);
                    var user = all_users[index];
                    app.makeListing(user._id, user.password, "some title", "some description", "some location", 123456, 5.00, true, callback, error_handler)
                }
                function callback() {
                    z++;
                    console.log("listing z = " + z);
                    if (z == 26 || z == 25){
                        console.log("print activeListings");
                        var active_listings = app.getActiveListings();
                        assert(active_listings.size(), 26);
                        delete13Listings(function(){
                            assert(active_listings.size(), 13);
                            var listing_count = 0;
                            var all_users = active_users.getAll();
                            for(var i in all_users){
                                if(all_users[i].getCurrentListingsIds().length == 1){
                                    listing_count++;
                                }
                                // console.log("active_users: ");
                                // console.log(active_users);
                            }
                            assert(listing_count == 13);
                            console.log("assert(list_count, 13) = " + (listing_count == 13));
                            console.log("about to call done");
                            done();
                        }, error_handler);
                    }
                };

                function delete13Listings(callback, error_handler){
                    console.log("delete13Listings called");
                    var all_listings = app.getActiveListings().getAll();
                    console.log("all_listings.size() = " + all_listings.length);
                    var index = 0;
                    for (var i in all_listings) {
                        console.log(i);
                        var listing = all_listings[i]
                        var user = active_users.get(listing.user_id);
                        if(user == undefined){
                            error_handler("user with user_id " + listing.user_id + " wasn't found in active_users");
                        }
                        app.removeListing(listing.user_id, user.password, listing._id, callback0, error_handler);
                    }
                    function callback0(){
                        index++;
                        console.log("callback 0 index = " + index);
                        if(index == 13){
                            callback();
                        }
                    }
                }
            }
        });
    });
});

describe("Transaction", function(){
    describe("Accept/Decline Transaction", function() {
        it("register 2 user/login both/user 1 makes listing/user 2 makes transaction/user 1 accepts transaction", function (done) {
            var active_users = app.getActiveUsers();
            var active_listings = app.getActiveListings();
            var active_transactions = app.getActiveTransactions();
            registerTwoEmailAddresses(function (user_id_arr) {
                var user_id1 = user_id_arr[0];
                var user_id2 = user_id_arr[1];
                var user1 = active_users.get(user_id1);
                var user2 = active_users.get(user_id2);
                app.makeListing(user_id1, user1.password, "user 1 listing", "listing made by user 1", "some location", new Date().getTime() + 100000, 5.00, true, function (listing) {
                    var listing = active_listings.get(listing._id);
                    console.log("User 1 made a listing: ");
                    console.log(listing);
                    app.makeTransactionRequest(user2._id, user2.password, listing._id, function (transaction) {
                        app.acceptTransactionRequest(user1._id, user1.password, transaction._id, function () {
                            console.log(transaction);
                            assert(transaction.isActive(), true)
                            assert(transaction.buyer_accepted_request, true);
                            assert(transaction.seller_accepted_request, true);
                            assert(transaction.buyer_user_id, user1._id);
                            assert(transaction.seller_user_id, user2._id);
                            done();
                        }, error_handler);
                    }, error_handler);
                }, error_handler);

            })
        });

        it("register 2 user/ login both/ user 1 makes listing/ user 1 makes transaction/ throw error, can't accept own transaction", function (done) {
            var active_users = app.getActiveUsers();
            var active_listings = app.getActiveListings();
            var active_transactions = app.getActiveTransactions();
            registerTwoEmailAddresses(function (user_id_arr) {
                var user_id1 = user_id_arr[0];
                var user_id2 = user_id_arr[1];
                var user1 = active_users.get(user_id1);
                var user2 = active_users.get(user_id2);
                app.makeListing(user_id1, user1.password, "user 1 listing", "listing made by user 1", "some location", new Date().getTime() + 100000, 5.00, true, function (listing) {
                    app.makeTransactionRequest(user1._id, user1.password, listing._id, function (transaction) {
                        app.acceptTransactionRequest(user1._id, user1.password, transaction._id, function () {
                            // var transaction = active_transactions.get(transaction_id);
                            // console.log(transaction);
                            // assert(transaction.isActive(), true)
                            // assert(transaction.buyer_accepted_request, true);
                            // assert(transaction.seller_accepted_request, true);
                            // assert(transaction.buyer_user_id, user1._id);
                            // assert(transaction.seller_user_id, user2._id);
                            done();
                        }, error_handler);
                    }, error_handler);
                }, error_handler);

            })

            function error_handler(message) {
                console.log(message);
                assert(message.indexOf("tried to create a transaction with") != -1, true);
                done();
            }
        });

        it("register 2 user/ login both/ user 1 makes listing/ user 2 makes transaction/ user 1 declines", function (done) {
            var active_users = app.getActiveUsers();
            var active_listings = app.getActiveListings();
            var active_transactions = app.getActiveTransactions();
            registerTwoEmailAddresses(function (user_id_arr) {
                var user_id1 = user_id_arr[0];
                var user_id2 = user_id_arr[1];
                var user1 = active_users.get(user_id1);
                var user2 = active_users.get(user_id2);
                app.makeListing(user_id1, user1.password, "user 1 listing", "listing made by user 1", "some location", new Date().getTime() + 100000, 5.00, true, function (listing) {
                    var listing = active_listings.get(listing._id);
                    console.log("User 1 made a listing: ");
                    console.log(listing);
                    app.makeTransactionRequest(user2._id, user2.password, listing._id, function (transaction) {
                        console.log("makeTransactionRequest, transaction:");
                        console.log(transaction)
                        app.declineTransactionRequest(user1._id, user1.password, transaction._id, function () {
                            console.log("declineTransactionRequest: ")
                            console.log(transaction);
                            console.log(user1);
                            console.log(user2);
                            done();
                        }, error_handler);
                    }, error_handler);
                }, error_handler);

            })

            function error_handler(message) {
                console.log(message);
                assert(message.indexOf("tried to create a transaction with") != -1, true);
                done();
            }
        });


        // it("register 2 user/ login both/ user 1 makes listing/ user 1 logs out/ user 2 makes transaction/ user 1 gets notification/" +
        //     " after a certain amount of time transaction request is closed", function(){
        //
        // });
        // it("register 3 user/ login all 3/ user 1 makes listing/ user 2 makes transaction/ user 1 accept/ user 3 attempts to make transaction/" +
        //     "throw error", function(){
        //
        // });
    });
    
    describe("Confirm/Reject Transaction", function(){
        it("register 2 user/login both/ user 1 makes listing/user 2 makes transaction/ user 1 accepts/ user 1 confirms/ user2 confirms", function(done){
            var active_users = app.getActiveUsers();
            var active_listings = app.getActiveListings();
            var active_transactions = app.getActiveTransactions();
            registerTwoEmailAddresses(function (user_id_arr) {
                var user_id1 = user_id_arr[0];
                var user_id2 = user_id_arr[1];
                var user1 = active_users.get(user_id1);
                var user2 = active_users.get(user_id2);
                app.makeListing(user_id1, user1.password, "user 1 listing", "listing made by user 1", "some location", new Date().getTime() + 100000, 5.00, true, function (listing) {
                    console.log("User 1 made a listing: ");
                    console.log(listing);
                    app.makeTransactionRequest(user2._id, user2.password, listing._id, function (transaction) {
                        app.acceptTransactionRequest(user1._id, user1.password, transaction._id, function () {
                            console.log(transaction);
                            assert(transaction.isActive(), true)
                            assert(transaction.buyer_accepted_request, true);
                            assert(transaction.seller_accepted_request, true);
                            assert(transaction.buyer_user_id, user1._id);
                            assert(transaction.seller_user_id, user2._id);
                            var counter = 0;
                            app.confirmTransaction(user1._id, user1.password, transaction._id, function(){
                                console.log("user 1 confirmed transaction");
                                callback();
                            }, error_handler);
                            app.confirmTransaction(user2._id, user2.password, transaction._id, function(){
                                console.log("user 2 confirmed transaction");
                                callback();
                            }, error_handler);
                            function callback(){
                                counter++;
                                console.log("counter: "+ counter);
                                if(transaction.isCompleted()){
                                    try {
                                        console.log(active_transactions.get(transaction._id));
                                        assert(typeof active_transactions.get(transaction._id), "undefined")
                                        console.log(user1);
                                        console.log(user2);
                                    }catch(e){done();}
                                }
                                else{
                                    error_handler("transaction hasn't been confirmed!");
                                    return;
                                }
                            }
                        });
                    }, error_handler);
                }, error_handler);
            }, error_handler);
        });
        it("register 2 user/login both/ user 1 makes listing/user 2 makes transaction/ user 1 accepts/ user 1 declines/ user 2 confirms", function(done) {
            var active_users = app.getActiveUsers();
            var active_listings = app.getActiveListings();
            var active_transactions = app.getActiveTransactions();
            registerTwoEmailAddresses(function (user_id_arr) {
                var user_id1 = user_id_arr[0];
                var user_id2 = user_id_arr[1];
                var user1 = active_users.get(user_id1);
                var user2 = active_users.get(user_id2);
                app.makeListing(user_id1, user1.password, "user 1 listing", "listing made by user 1", "some location", new Date().getTime() + 100000, 5.00, true, function (listing) {
                    console.log("User 1 made a listing: ");
                    console.log(listing);
                    app.makeTransactionRequest(user2._id, user2.password, listing._id, function (transaction) {
                        console.log("makeTransactionRequest callback:");
                        app.acceptTransactionRequest(user1._id, user1.password, transaction._id, function () {
                            console.log("acceptTransactionRequest")
                            console.log(transaction);
                            assert(transaction.isActive(), true)
                            assert(transaction.buyer_accepted_request, true);
                            assert(transaction.seller_accepted_request, true);
                            assert(transaction.buyer_user_id, user1._id);
                            assert(transaction.seller_user_id, user2._id);
                            var counter = 0;
                            app.confirmTransaction(user1._id, user1.password, transaction._id, function(){
                                console.log("user 1 confirmed transaction");
                                callback();
                            }, error_handler);
                            app.rejectTransaction(user2._id, user2.password, transaction._id, function(){
                                console.log("user 2 rejected transaction");
                                callback();
                            }, error_handler);
                            function callback(){
                                console.log(transaction)
                                counter++;
                                console.log("counter: "+ counter);
                                if(!transaction.isCompleted() && !transaction.isActive()){
                                    try {
                                        console.log(active_transactions.get(transaction._id));
                                        assert(typeof active_transactions.get(transaction._id), "undefined")
                                        console.log(user1);
                                        console.log(user2);
                                    }catch(e){ done(); }

                                }
                                else{
                                    error_handler("transaction hasn't been confirmed!");
                                    return;
                                }
                            }
                        })
                    }, error_handler);
                }, error_handler);
            }, error_handler);
        });
    });

    describe("Multiple Transactions", function(){
        it("register 3 users/login all/user 1 and 2 make listing/ user 3 makes transaction with both/ user 1 and 2 accept", function(done){
            var active_users = app.getActiveUsers();
            var active_listings = app.getActiveListings();
            var active_transactions = app.getActiveTransactions();
            register3EmailAddresses(function (user_id_arr) {
                var user_id1 = user_id_arr[0];
                var user_id2 = user_id_arr[1];
                var user_id3 = user_id_arr[2];
                var user1 = active_users.get(user_id1);
                var user2 = active_users.get(user_id2);
                var user3 = active_users.get(user_id3);
                var listing1;
                var listing2;
                app.makeListing(user1._id, user1.password, "user 1 listing", "a listing made by user 1", "(0,0)", new Date().getTime() + 10000, 5.00, false, function(listing){
                    console.log("user1 made a listing:")
                    console.log(listing);
                    listing1 = listing;
                    app.makeTransactionRequest(user3._id, user3.password, listing1._id, function(transaction){
                        console.log("user3 requested a transaction on listing1 with user1:");
                        console.log(transaction)
                        app.acceptTransactionRequest(user1._id, user1.password, transaction._id, function(){
                            console.log("user 1 has accepted the transaction:")
                            console.log(transaction);
                        }, error_handler)
                    }, error_handler)
                }, error_handler)
                app.makeListing(user2._id, user2.password, "user 2 listing", "a listing made by user 2", "(1,1)", new Date().getTime() + 10000, 6.00, true, function(listing){
                    console.log("user2 made a listing: ");
                    console.log(listing);
                    listing2 = listing;
                    app.makeTransactionRequest(user3._id, user3.password, listing2._id, function(transaction){
                        console.log("user 3 requested a transaction on listing2 with user2");
                        console.log(transaction);
                        app.acceptTransactionRequest(user2._id, user2.password, transaction._id, function(){
                            console.log("user 2 has accepted the transaction: ")
                            console.log(transaction);
                            done();
                        });
                    }, error_handler);
                }, error_handler)
            });
        });
        it("register 3 users/ login all/user 1 makes listing/user 2 and 3 make transactions/ user 1 tries accepting both", function(done){
            var active_users = app.getActiveUsers();
            var active_listings = app.getActiveListings();
            var active_transactions = app.getActiveTransactions();
            function error_handler(e){
                console.log(e);
                assert(active_transactions.size(), 1);
                done();
            }
            register3EmailAddresses(function(user_id_arr){
                var user_id1 = user_id_arr[0];
                var user_id2 = user_id_arr[1];
                var user_id3 = user_id_arr[2];
                var user1 = active_users.get(user_id1);
                var user2 = active_users.get(user_id2);
                var user3 = active_users.get(user_id3);
                app.makeListing(user1._id, user1.password, "user 1 listing", "a listing made by user 1", {x:0, y:0}, new Date().getTime() + 10000, 5.00, false, function(listing){
                    console.log("user1 made a listing:")
                    console.log(listing);
                    var listing1 = listing;
                    app.makeTransactionRequest(user3._id, user3.password, listing1._id, function(transaction1){
                        console.log("user3 requested a transaction on listing1 with user1:");
                        console.log(transaction1)
                        app.makeTransactionRequest(user2._id, user2.password, listing1._id, function(transaction2){
                            console.log("user2 requested a transaction on listing1 with user1:");
                            console.log(transaction2)
                            assert(active_transactions.size(), 2)
                            app.acceptTransactionRequest(user1._id, user1.password, transaction1._id, function(){
                                console.log("user 1 has accepted the transaction:")
                                console.log(transaction1);
                            }, error_handler)
                            app.acceptTransactionRequest(user1._id, user1.password, transaction2._id, function(){
                                console.log("user 1 has accepted the transaction:")
                                console.log(transaction2);
                            }, error_handler)
                        });
                    }, error_handler)
                }, error_handler)
            });
        });
    })
});

describe("Update location", function(){
    it("register a user, update his location, check that location was updated",function(done){
        var active_users = app.getActiveUsers();
        registerTwoEmailAddresses(function (user_id_arr) {
            var user_id1 = user_id_arr[0];
            var user_id2 = user_id_arr[1];
            var user1 = active_users.get(user_id1);
            var user2 = active_users.get(user_id2);
            console.log("user1 location before update");
            console.log(user1.location)
            app.updateUserLocation(user_id1, user1.password, {x:1, y:1}, function(){
                console.log("user 1 location after update");
                console.log(user1.location);
                assert(user1.location.x, 1)
                assert(user1.location.y, 1)
                done();
            }, error_handler);
        })
    })
});

describe("Send message", function(){
    it("register two users, make listing, make transaction, accept transaction, send message", function(done){
        var active_users = app.getActiveUsers();
        var active_listings = app.getActiveListings();
        var active_transactions = app.getActiveTransactions();
        register3EmailAddresses(function (user_id_arr) {
            var user_id1 = user_id_arr[0];
            var user_id2 = user_id_arr[1];
            var user_id3 = user_id_arr[2];
            var user1 = active_users.get(user_id1);
            var user2 = active_users.get(user_id2);
            var user3 = active_users.get(user_id3);
            var listing1;
            var listing2;
            app.makeListing(user1._id, user1.password, "user 1 listing", "a listing made by user 1", "(0,0)", new Date().getTime() + 100000, 5.00, false, function(listing){
                console.log("user1 made a listing:")
                console.log(listing);
                listing1 = listing;
                app.makeTransactionRequest(user3._id, user3.password, listing1._id, function(transaction){
                    console.log("user3 requested a transaction on listing1 with user1:");
                    console.log(transaction)
                    app.acceptTransactionRequest(user1._id, user1.password, transaction._id, function(){
                        console.log("user 1 has accepted the transaction:")
                        console.log(transaction);
                    }, error_handler)
                }, error_handler)
            }, error_handler)
            app.makeListing(user2._id, user2.password, "user 2 listing", "a listing made by user 2", "(1,1)", new Date().getTime() + 100000, 6.00, true, function(listing){
                console.log("user2 made a listing: ");
                console.log(listing);
                listing2 = listing;
                app.makeTransactionRequest(user3._id, user3.password, listing2._id, function(transaction){
                    console.log("user 3 requested a transaction on listing2 with user2");
                    console.log(transaction);
                    app.acceptTransactionRequest(user2._id, user2.password, transaction._id, function(){
                        console.log("user 2 has accepted the transaction: ")
                        console.log(transaction);
                        app.sendChatMessage(user2._id, user2.password, transaction._id, "FACK!", function(message){
                            console.log(message);
                            console.log(transaction);
                            assert(transaction.conversation.messages[0] == message);
                            assert(transaction.conversation.messages[0].text == "FACK!");
                        }, error_handler)
                        app.sendChatMessage(user3._id, user3.password, transaction._id, "HELLO!", function(message){
                            console.log(message);
                            console.log(transaction);
                            assert(transaction.conversation.messages[1] == message);
                            assert(transaction.conversation.messages[1].text == "HELLO!");
                        }, error_handler)
                        app.sendChatMessage(user1._id, user1.password, transaction._id, "FACK!", function(message){
                            console.log(message);
                            console.log(transaction);
                        }, error_handler)
                        function error_handler(e){
                            console.log(e)
                            done();
                        }
                    });
                }, error_handler);
            }, error_handler)
        });
    });
});

describe.only("Expired Listing Cleaner", function(){
    it("register two users, user 1 makes 2 listings that expire immediately, wait 10 seconds, see if listings have been cleaned up", function(done){
        var active_transactions = app.getActiveTransactions();
        var active_listings = app.getActiveListings();
        var active_users = app.getActiveUsers()
        this.timeout(100000);
        function error_handler(e){
            console.log(e);
        }
        registerTwoEmailAddresses(function (user_id_arr) {
            var user_id1 = user_id_arr[0];
            var user_id2 = user_id_arr[1];
            var user1 = active_users.get(user_id1);
            var user2 = active_users.get(user_id2);
            app.makeListing(user_id1, user1.password, "user 1 listing", "listing made by user 1", "some location", new Date().getTime(), 5.00, true, function (listing) {
                console.log(active_listings)
                assert(active_listings.size(), 1);
                setTimeout(function(){
                    assert(active_listings.size() == 0);
                    done();
                }, 10000);
            }, error_handler);
        });
    });
})

describe("Socket.io", function (){
   it("connecting, sending a message back and forth, then disconnect", function(done){
       var socket = require('socket.io-client')(base_url);
       socket.on('connect', function(){
           console.log("client has connected");
       });
       socket.on('event', function(data){
           console.log("event received on client side");
           console.log(data);
           console.log("triggering my other event from client side");
           socket.emit('my other event', { data: 'client data' });
           assert(data.data == 'server data');
           socket.disconnect();
       });
       socket.on('disconnect', function(){
           console.log("client has disconnected");
           done();
       });
   });

    it("register 2 users and login/ user 1 make listing/ user 2 request transaction/ user 1 and user 2 accept/", function(done){
        var active_users = app.getActiveUsers();
        var active_listings = app.getActiveListings();
        var active_transactions = app.getActiveTransactions();

        var socket = require('socket.io-client')(base_url);
        socket.on('login_response', response_handler);
        socket.on('logout_response', response_handler_with_done);
        socket.on('make_listing_response', function(res){
            console.log(res);
            console.log(active_listings);
            console.log(active_users.getAll());
            done();
        })

        registerTwoEmailAddresses(function (user_id_arr) {
            //username1: bowenjin1
            //username2: bowenjin2
            //password: chocho513
            console.log(active_users);
            console.log(user_id_arr);
            var user_id1 = user_id_arr[0];
            var user_id2 = user_id_arr[1];
            // socket.emit('login', {username: "bowenjin1", password: "chocho513"});
            // socket.emit('logout', {user_id: user_id1, password: "chocho513"});
            socket.emit('make_listing', {
                user_id: user_id1,
                password: "chocho513",
                title: "gay老",
                description: "菊花爆了",
                location: {x: 0, y: 0},
                expiration_time: new Date().getTime() + 10000,
                price: 5.00,
                buy: true,
            });

        });

        function response_handler(res){
            console.log(res);
        }
        function response_handler_with_done(res){
            console.log(res)
            console.log(active_users)
            done();
        }
    });
});

function getAllPossibleStrings(length){
    var possibleStrings = [];
    recursive("", length);
    console.log("possibleStrings length: " + possibleStrings.length);
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
        function callback3(user){
            i++;
            console.log("callback3 called i value is " + i);
            if(i == 26 || i == 25){
                console.log("callback called");
                callback();
            }
        }
        function error_handler(error){
            console.log(error);
        }
    }
}

function registerTwoEmailAddresses(callback){
    console.log("registerTwoEmailAddresses called");
    var i = 0;
    var user_id_arr = [];
    dropDatabases(callback0, error_handler);
        function callback0(){
            console.log("dropDatabases callback0 called")
            app.registerEmail('someemail1' + "@vanderbilt.edu", callback1, error_handler);
            app.registerEmail('someemail2' + "@vanderbilt.edu", callback1, error_handler);

        function callback1(verification_code, email_address){
            var username1 = "bowenjin1";
            var username2 = "bowenjin2";
            app.registerVerificationCode(verification_code, username1, "chocho513", "chocho513", email_address, callback2, error_handler);
            app.registerVerificationCode(verification_code, username2, "chocho513", "chocho513", email_address, callback2, error_handler);

        }
        function callback2(username, password) {
            // users.push({username: username, password: password, email_address: email_address});
            console.log("attempting to login as " + username + " with password " + password);
            app.login(username, password, callback3, error_handler);
        }
        function callback3(user){
            user_id_arr.push(user._id)
            i++;
            console.log("callback3 called i value is " + i);
            if(i == 2){
                console.log("callback called");
                callback(user_id_arr);
            }
        }
        function error_handler(error){
            console.log(error);
        }
    }
}

function register3EmailAddresses(callback){
    console.log("registerTwoEmailAddresses called");
    var i = 0;
    var user_id_arr = [];
    dropDatabases(callback0, error_handler);
    function callback0(){
        console.log("dropDatabases callback0 called")
        app.registerEmail('someemail1' + "@vanderbilt.edu", callback1, error_handler);
        app.registerEmail('someemail2' + "@vanderbilt.edu", callback1, error_handler);
        app.registerEmail('someemail3' + "@vanderbilt.edu", callback1, error_handler);

        function callback1(verification_code, email_address){
            var username1 = "bowenjin1";
            var username2 = "bowenjin2";
            var username3 = "bowenjin3";
            app.registerVerificationCode(verification_code, username1, "chocho513", "chocho513", email_address, callback2, error_handler);
            app.registerVerificationCode(verification_code, username2, "chocho513", "chocho513", email_address, callback2, error_handler);
            app.registerVerificationCode(verification_code, username3, "chocho513", "chocho513", email_address, callback2, error_handler);

        }
        function callback2(username, password) {
            // users.push({username: username, password: password, email_address: email_address});
            console.log("attempting to login as " + username + " with password " + password);
            app.login(username, password, callback3, error_handler);
        }
        function callback3(user){
            user_id_arr.push(user._id)
            i++;
            console.log("callback3 called i value is " + i);
            if(i == 3){
                console.log("callback called");
                callback(user_id_arr);
            }
        }
        function error_handler(error){
            console.log(error);
        }
    }
}

// describe('Array', function() {
//     describe('#indexOf()', function() {
//         it('should return -1 when the value is not present', function() {
//             assert.equal(-1, [1,2,3].indexOf(4));
//         });
//     });
// });
