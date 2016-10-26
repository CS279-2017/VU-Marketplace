module.exports = User;

//do not include password in User object, use password only to retrieve from database on login
function User(username, password, email){
    //TODO: find way to get a unique id that we can then assign the user, probably have to get it by querying the Database
    //this.id (assigned when retrieved from database)
    this.username = username;
    this.password = password;
    this.email_address = email
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
    //initUserFromDatabase initializes a user object based on an object returned from database
    initUserFromDatabase: function(user){
        this._id = user._id;
        this.username = user.username;
        this.password = user.password;
        this.venmo_id = user.venmo_id;
        this.email_address = user.email_address;
        this.current_transactions_ids = user.current_transactions_ids
        this.all_transaction_ids = user.all_transaction_ids;
        this.current_location = user.current_location;
    },
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
    makeListing: function(id, title, description, location, expiration_time, price, buy){
        var creation_time = new Date(); //should we use Date? Can date we converted to JSON and then converted back to date?
        // how should we determine id of new listing? should we pass it in as a parameter?
        return new Listing(id ,this.username, title, description, location, creation_time, expiration_time, price, buy)
        //location might have to be modified into appropriate structure
    },
    //TODO: make Transaction should call make Transaction on the listing
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