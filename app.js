var express = require('express');
var app = express();

var exports = module.exports = {};
exports.closeServer = function(){
    server.close();
};

var active_listings = null;
var users_collection = null;
var active_transactions = null;
app.get('/', function (req, res) {
    res.send('Hello World!');
});



var server = app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
    active_listings = new ActiveListings();
    active_transactions = new ActiveTransactions();
    users_collection = new UsersCollection();
    var user = new User("bowen", "jin");
    var transaction = new Transaction();
    transaction.user_buy = user;
    var conversation = new Conversation();
    conversation.send_message(new Message());
    conversation.send_message(new Message());
    conversation.send_message(new Message());
    transaction.conversation = conversation;
    console.log(JSON.stringify(transaction));
});

function Listing(id, title, description, location, creation_time, expiration_time, price, buy){
    this.id = id;
    this.title = title;
    this.description = description;
    this.location = location;
    this.creation_time = creation_time;
    this.expiration_time = expiration_time;
    this.price = price;
    this.buy = buy;
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


function User(username, password){
    this.id = null;
    this.username = username;
    this.password = password;
    this.venmo_id = null;
    this.current_transaction = null; //not saved onto db
    this.current_location = null; // not saved onto db
    this.logged_in = null; //not saved onto db
}

User.prototype = {
    constructor: User,
    setVenmoId: function(venmo_id){
        this.venmo_id = venmo_id;
        //some function that does an update in the db in table Users
    },
    setCurrentTransaction: function(transaction){
        this.current_transaction = transaction;
    },
    setCurrentLocation: function(location){
        this.current_location = location;
    },
    getTransactionHistory: function(){
        //query database for all transactions involving the user
    },
}

//a object that contains all the users that have ever been registered
//get returns that user, returns null if user not found
//add adds a new user
//adding a user updates database
function UsersCollection(database){
    //these two instance variables will be synced with database
    this.users = {};
    this.max_id = -1;
}

//
UsersCollection.prototype = {
    constructor: UsersCollection,
    add: function(user){
        this.users[username] = user;
        //add to database, can be done concurrently
    },
    get: function(username){
        return this.users[username];
    },
    delete: function(username){
        delete this.users[username]
        //delete row from database
    },
    getNewId: function(){
        return this.max_id + 1;
    }
}

//transaction is saved to database when it has been terminated
//note create the transaction before deleting a listing
function Transaction(){
    this.id = null;
    this.user_buy = null; //convert to json and save to database
    this.user_sell = null; //convert to json and save to database
    this.conversation = null; //convert to json and save to database
    this.listing = null; //convert to json and then save to database
    this.user_buy_initiate = false; //not added to database
    this.user_sell_initiate = false; // not added to database
    this.user_buy_confirm_meet_up = false; //not added to database
    this.user_sell_confirm_meet_up = false; //not added to database
}

Transaction.prototype = {
    constructor: Transaction,
}

//current active transactions, adds a transaction to database when it is removed from active transactions
function ActiveTransactions(){
    this.transactions = {};
}


ActiveTransactions.prototype = {
    constructor: ActiveTransactions,
    add: function(transaction){
        active_transactions[transaction.id] = transaction;
    },
    remove: function(transaction){
        //add transaction to Transactions table in db
       delete active_transactions[transaction.id];

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
}

function Message(){
    this.text = "";
    this.user = null;
    this.time_sent = null;
}

Message.prototype = {
    constructor: Message,
}

function validateLoginInfo(username, password){
    if(users_collection.get(username) != undefined){
        return true;
    }
}

function validateRegistrationInfo(username, password){
    //check to make sure to username and password are valid strings

    //check to make sure username isn't already taken
    if(users_collection.get(username) == undefined){
        return true;
    }
}

function registerUser(username, password){
    if(validateRegistrationInfo(username, password)){

        users_collection.add()
    }
}

function loginUser(username, password){

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

