var express = require('express');
var bodyParser = require('body-parser')

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = require('mongodb').MongoClient;
// Connection URL. This is where your mongodb server is running.
var url = 'mongodb://localhost:27017/mealplanappserver';
// // Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
        //HURRAY!! We are connected. :)
        console.log('Connection established to', url);

    //     // Get the documents collection
    //     var collection = db.collection('users');
    //
    //     //Create some users
    //     var user1 = {name: 'modulus admin', age: 42, roles: ['admin', 'moderator', 'user']};
    //     var user2 = {name: 'modulus user', age: 22, roles: ['user']};
    //     var user3 = {name: 'modulus super admin', age: 92, roles: ['super-admin', 'admin', 'moderator', 'user']};
    //
    //     // Insert some users
    //     collection.insert([user1, user2, user3], function (err, result) {
    //         if (err) {
    //             console.log(err);
    //         } else {
    //             console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result);
    //         }
    //         //Close connection
    //         db.close();
    //     });
    }
});

var app = express();

var exports = module.exports = {};
exports.closeServer = function(){
    server.close();
};

var active_listings = null;
var active_users = null;
var active_transactions = null;

var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.post('/', function (req, res) {
    //TODO: clean req body to make sure doesn't contain any SQL injection or other threats
    //TODO: also make sure that somebody isn't spamming the server
    if(req.body.command == 'register'){
        var json = req.body.json;
        try {
            var user_json = JSON.parse(json);
            var user = new User(user_json.username, user_json.password);
            // console.log(JSON.stringify(user))
        }catch(e){ return null; }
        res.send(user.username);
    }
    // res.send('POST request to the homepage');
});


var server = app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
    active_listings = new ActiveListings();
    active_transactions = new ActiveTransactions();
    active_users = new ActiveUsers();
});


function Listing(id, user, title, description, location, creation_time, expiration_time, price, buy){
    //Listing(id, titile, description, location, creation_time, expiration_time, price, buy)
    if(arguments.length == 8) {
        this.id = id;
        this.user = user;
        this.title = title;
        this.description = description;
        this.location = location;
        this.creation_time = creation_time;
        this.expiration_time = expiration_time;
        this.price = price;
        this.buy = buy;
        this.transaction_id = null;
    }
        //Listing()
    else if(arguments.length == 0){
        //create an empty listing
    }
        //Listing(id)
    else if(arguments.length == 1){
        //get argument from database, get listing with the id
    }


}

Listing.prototype = {
    constructor: Listing,
}

function ActiveListings(){
    this.listings = []
}

//always create transaction before deleting listing
ActiveListings.prototype = {
    constructor: ActiveListings,
    add: function(listing) {
        this.listings.add(listing);
    },
    delete: function(index){
        //add transaction to Transactions table in db
        this.listings.splice(index, 1);

    }
}

//do not include password in User object, use password only to retrieve from database on login
function User(username, password, email){
    this.id = null;
    this.username = username;
    this.password = password;
    this.email = email
    this.venmo_id = null;
    //TODO:
    //should user store a history of all the transactions and listings or should he/she just query the database?
    //Note: we want to minimize number of database queries, only use database as backup storage incase server crashes
    this.current_transactions_ids = [];
    this.all_transaction_ids = [];
    // this.all_listing_ids = [];

    this.current_location = null; // not saved onto db
    this.logged_in = null; //not saved onto db
}

User.prototype = {
    //TODO: add getters for username and email, note: password should never be gotten only used internally in a user object
    constructor: User,
    setVenmoId: function(venmo_id){
        this.venmo_id = venmo_id;
        //some function that does an update in the db in table Users
    },
    setCurrentLocation: function(location){
        this.current_location = location;
    },
    getTransactionHistory: function(){
        //TODO:
        //query database for all transactions involving the user
        //use all_transaction_ids
    },
    convertToJSON: function(){
        //this is necessary because there are properties of user that shouldn't be converted to JSON, shouldn't be saved to database
        return JSON.stringify({
            id: this.id,
            username: this.username,
            password: this.password,
            venmo_id: this.venmo_id,
        });

        // return JSON.stringify(this, function( key, value) {
        //     if(key == 'current_transaction') {
        //         return value.convertToJSON();
        //     } else {
        //         return value;
        //     };
        // });
    },
    makeListing: function(id, title, description, location, expiration_time, price, buy){
        var creation_time = new Date(); //should we use Date? Can date we converted to JSON and then converted back to date?
        // how should we determine id of new listing? should we pass it in as a parameter?
        return new Listing(id ,this.username, title, description, location, creation_time, expiration_time, price, buy)
        //location might have to be modified into appropriate structure
    },
    makeTransaction:function(listing){
        //TODO:
        //make create a transaction and add it to activeTransactions
        var user_buy = null;
        var user_sell = null;
        if(this == listing.user){
            //user cannot make a transaction with his or her own listing
            throw user.username + " cannot make a transaction from his/her own listing";
        }
        else{
            if(listing.buy == true){
                user_buy = listing.user;
                user_sell = this;
            }
            else if(listing.buy == false){
                user_buy = this;
                user_sell = listing.user;
            }
            else{
                throw "buy parameter of listing with id " + listing.id + "must be true or false"
            }
        }
        var transaction = new Transaction(listing.id, user_buy, user_sell, listing);
        listing.transaction_id = transaction.id;
        return transaction;
        //update transaction_id in listing with new transaction_id
        //note we only store successful transactions, thus we delay pushing transaction to database until it has completed

    },
    initiateTransaction: function(transaction, willInititate){
        //TODO:
        //maybe add transaction_id to current_transactions of user, as well as all_transactions,
        //notify other user that someone has selected their listing
        transaction.initiate(this, willInititate);
    },
    removeTransaction: function(transaction_id){
        var index = this.current_transactions_ids.indexOf(transaction_id);
        if(index > -1){
            this.current_transactions_ids.splice(index, 1);
        }
    }
}

//TODO:
//a object that contains all the users that have ever been registered
//get returns that user, returns null if user not found
//add adds a new user
//adding a user updates database
function ActiveUsers(database){
    //these two instance variables will be synced with database
    this.users = {};
    this.max_id = -1;
}

//
ActiveUsers.prototype = {
    constructor: ActiveUsers,
    login: function(user){
        this.users[username] = user;
        max_id++;
    },
    get: function(username){
        return this.users[username];
    },
    logout: function(username){
        delete this.users[username]
        //we don't delete from database, because database keeps track of all registered users
    },
    register: function(username, password){
        //TODO:
        //add to database, can be done concurrently
    },
    getNewId: function(){
        return guid();
        //TODO:
        //if we wanted to have ids signify the number of values in the database at that time, we can query database
        //when the database is created to get the size and thus the appropriate index value;
    }
}

//TODO:
//transaction is saved to database when it has been terminated
//note create the transaction before deleting a listing
//note if we had to recreate transaction object from database, we would need a parameter for conversation as well
function Transaction(id, user_buy, user_sell, listing){
    this.id = id;
    this.user_buy = user_buy; //convert to json and save to database
    this.user_sell = user_sell; //convert to json and save to database
    this.conversation = new Conversation(); //convert to json and save to database
    this.listing = listing; //convert to json and then save to database
    this.user_buy_initiate = null; //not added to database
    this.user_sell_initiate = null; // not added to database
    this.user_buy_confirm_meet_up = false; //not added to database
    this.user_sell_confirm_meet_up = false; //not added to database
    //if both initiates are true then that means transaction is active,
    //if both confirms are not null that means transaction is then deactivated
}

Transaction.prototype = {
    constructor: Transaction,
    sendMessage: function(text, username){
        //sends a message to the current conversation
        //current_transaction cannot be null
        if(this.conversation == null){
            throw "tried to send message to null Conversation";
        }
        //(Message(text, username, time_sent)
        var message = new Message(text, username, new Date());
        this.conversation.send_message(message);
    },
    initiate: function(user, willInitiate){
        //this prevents the intitiate state from being changed after both buyer and seller have confirmed
        if(user_buy_initiate != true || user_sell_initiate != true){
            if(user == this.user_buy){
                this.user_buy_initiate = willInitiate;
            }
            else if(user == this.user_sell){
                this.user_sell_initiate = willInitiate;
                //send notification to buyer
            }
            else{
                throw "user does not match user_buy or user_sell for this Transaction"
            }
            if(user_buy_initiate == false){
                //end transaction and notify both user_buy and user_sell that transaction was terminated by buyer
                //or just notify user_sell, still unsure
            }
            else if(user_sell_initiate == false){
                //end transaction and notify both user_buy and user_sell that transaction was terminated by seller
                //or just notify user_buy, still unsure
            }
            else if(user_buy_initiate == true && user_sell_initiate == true){
                //send out a message that makes both users enter into the transaction, i.e initiate transaction
            }
        }
    },
    terminate: function(){
        //TODO:
        //remove the transaction from the ActiveTransactions (that is the only reference to transaction)
        //remove the transaction's transaction id from both users of the transaction's current transactions
        if(this.id != null) {
            this.user_buy.removeTransaction(this.id);
            this.user_sell.removeTransaction(this.id);
        }
    },
    convertToJSON: function(){
        // return JSON.stringify(this, function( key, value) {
        //     if(key == 'user_buy') {
        //         return value.convertToJSON();
        //     } else if(key == 'user_sell') {
        //         return value.convertToJSON();
        //     }else if(key == 'conversation'){
        //         return value.convertToJSON();
        //     }
        // });
    }
}

//current active transactions, adds a transaction to database when it is removed from active transactions
function ActiveTransactions(){
    this.transactions = {};
}

ActiveTransactions.prototype = {
    constructor: ActiveTransactions,
    add: function(transaction){
        active_transactions[transaction.id] = transaction;
        //TODO:
        //Add transaction to database
    },
    remove: function(transaction_id){
       delete active_transactions[transaction_id];
        //TODO:
        //update transaction in database to make inactive
    },
    get: function (transaction_id){
        return active_transactions[transaction_id];
    }
}

function Conversation(){
    this.messages = [];
}

Conversation.prototype = {
    constructor: Conversation,
    send_message: function(message){
        this.messages.push(message);
    },
    convertToJSON: function(){
        return JSON.stringify(this, function( key, value) {
            if(key == 'messages') {
                var ret = [];
                for(var message in this.messages){
                    ret.push(messages.converToJSON())
                }
            }
            else{
                return value;
            }
        });
    }
}

function Message(text, username, time_sent){
    this.text = text;
    this.username = username; //must be username rather than user to avoid circular reference
    //if we ever need the user's info we can look up the user using this username;
    this.time_sent = time_sent;
}

Message.prototype = {
    constructor: Message,
    converToJSON: function(){
        return JSON.stringify(this, function( key, value) {
            if (key == 'user') {
                return user.convertToJSON();
            } else{
                return value;
            }
        });
    }
}

// function validateLoginInfo(username, password){
//     if(users_collection.get(username) != undefined){
//         return true;
//     }
// }
//
// function validateRegistrationInfo(username, password){
//     //TODO:
//     //check to make sure to username and password are valid strings
//
//     //check to make sure username isn't already taken
//     if(users_collection.get(username) == undefined){
//         return true;
//     }
// }
//
// function registerUser(username, password){
//     if(validateRegistrationInfo(username, password)){
//
//         users_collection.add()
//     }
// }

// function loginUser(username, password){
//
// }

function registerEmailAddress(email_address){
    //TODO: implement details below
    //validate email address is real

    //validate email address is vanderbilt.edu

    //validate email address send out verification email

    //notify client that verification email has been sent (client moves to text page with verification code username and password)
}

function registerVerificationCode(verification_code, username, password, confirm_password){
    //TODO: implement details below
    //verify that the verification code is valid, or if user has clicked on verification link

    //verify that username is valid

    //verify password is valid

    //verify password confirm matches password

    //create user and add to database

    //store username and password on device

    //log client in
}

function login(username, password){
    //TODO: implement details below
    //query database for user with given username and password
    //if not found: alert user that login failed, because incorrect username/password
    //else: log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
}

// function recoverUsername(email_address){
//     //TODO: implement details below
//     //query User database for user with the given email address
//     //send email containing username to the email address
// }

function resetPassword(email_address){
    //send message back to client saying "if valid email address then you will receive a reset password at this link"
    //search database to see if valid email_address
    //if so, send email to email address containing verification link to reset
}

function resetPasswordVerification(new_password, new_password_confirm){
    //check to see if user has clicked on verification link
    //check to see if new password is valid
    //check to see if new password confirm is equal to new password
    //update the password for the user in the database (note verification code must be associated with a user)
}

// function getUserFromDatabase(username){
//
// }
//
// function addUserToDatabase(user){
//
// }
//
// function getTransactionFromDatabase(transaction_id){
//
// }
//
// function addTransactionToDatabase(transaction_id){
//
// }


function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + s4() + s4() +
        s4() + s4() + s4() + s4();
}
