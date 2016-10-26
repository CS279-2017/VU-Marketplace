module.exports = User;

//User Database Schema:
//we use all_listing
//{_id, username, password, email_address, venmo_id, current_listing_ids, previous_listing_ids, previous_transaction_ids, all_transaction_ids, current_location}
//do not include password in User object, use password only to retrieve from database on login
function User(username, password, email){
    //TODO: find way to get a unique id that we can then assign the user, probably have to get it by querying the Database
    //this.id (assigned when retrieved from database)
    this.username = username;
    this.password = password;
    this.email_address = email
    this.venmo_id = null;
    this.current_listings_ids = [];
    this.previous_listings_ids = [];
    this.current_transactions_ids = [];
    this.previous_transactions_ids = [];

    this.current_location = null; // not saved onto db
    this.logged_in = null; //not saved onto db
}

User.prototype = {
    //TODO: add getters for username and email, note: password should never be gotten only used internally in a user object
    constructor: User,
    //initUserFromDatabase initializes a user object based on an object returned from database
    initFromDatabase: function(user){
        this._id = user._id;
        this.username = user.username;
        this.password = user.password;
        this.email_address = user.email_address;
        this.current_location = user.current_location;
        this.venmo_id = user.venmo_id;
        this.current_listings_ids = user.current_listings_ids;
        this.previous_listings_ids = user.previous_listings_ids;
        this.current_transactions_ids = user.current_transactions_ids
        this.previous_transactions_ids = user.previous_transactions_ids;
    },
    getId: function(){
        return this._id;
    },
    getUsername: function(){
        return this.username;
    },
    getPassword: function(){
        return this.password;
    },
    getEmailAddress: function(){
        return this.email_address;
    },
    getCurrentLocation: function(location){
        return this.current_location;
    },
    setCurrentLocation: function(location){
        this.current_location = location;
    },
    getVenmoId: function(){
        return this.venmo_id;
    },
    setVenmoId: function(venmo_id){
        this.venmo_id = venmo_id;
        //some function that does an update in the db in table Users
    },
    getCurrentListingsIds: function(){
        return this.current_listings_ids;
    },
    addCurrentListingId: function(current_listing_id){
        this.current_listings_ids.push(current_listing_id);
    },
    removeCurrentListingId: function(current_listing_id){
        var index = this.current_listings_ids.indexOf(current_listing_id);
        if(index <= -1){
            throw "listing id " + current_listing_id + " does not exist in current listing ids of user with id " + _id;
        }
        this.current_listings_ids.splice(index, 1);
    },
    getPreviousListingsIds: function(){
        return this.previous_listings_ids;
    },
    addPreviousListingId: function(previous_listing_id){
        this.previous_listings_ids.push(previous_listing_id);
    },
    removePreviousListingId: function(previous_listing_id){
        var index = this.previous_listing_ids.indexOf(previous_listing_id);
        if(index <= -1){
            throw "listing id " + previous_listing_id + " does not exist in previous listings ids of user with id " + _id;
        }
        this.previous_listing_ids.splice(index, 1);
    },
    getCurrentTransactionIds: function(){
        return this.current_transactions_ids;
    },
    addCurrentTransactionId: function(current_transaction_id){
        this.current_transactions_ids.push(current_transaction_id);  
    },
    removeCurrentTransactionId: function(current_transaction_id){
        var index = this.current_transactions_ids.indexOf(previous_listing_id);
        if(index <= -1){
            throw "transaction id " + current_transaction_id + " does not exist in current transactions ids of user with id " + _id;
        }
        this.current_transactions_ids.splice(index, 1);
    },
    getPreviousTransactionsIds: function(){
        return this.previous_transactions_ids;
    },
    addPreviousTransactionId: function(previous_transaction_id){
        this.previous_transactions_ids.add(previous_transaction_id);
    },
    removePreviousTransactionId: function(previous_transaction_id){
        var index = this.previous_transactions_ids.indexOf(previous_transaction_id);
        if(index <= -1){
            throw "transaction id " + previous_transaction_id+ " does not exist in previous transaction ids of user with id " + _id;
        }
        this.previous_transactions_ids.splice(index, 1);
    },
    makeListing: function(title, description, location, expiration_time, price, buy){
        var creation_time = new Date(); //should we use Date? Can date we converted to JSON and then converted back to date?
        // how should we determine id of new listing? should we pass it in as a parameter?
        return new Listing (this._id, title, description, location, creation_time, expiration_time, price, buy)
        //location might have to be modified into appropriate structure
    },
    //TODO: make Transaction should call make Transaction on the listing
    makeTransaction:function(listing){
        //TODO:
        return listing.makeTransaction(this._id);
        //make create a transaction and add it to activeTransactions
        // var user_buy = null;
        // var user_sell = null;
        // if(this == listing.user){
        //     //user cannot make a transaction with his or her own listing
        //     throw user.username + " cannot make a transaction from his/her own listing";
        // }
        // else{
        //     if(listing.buy == true){
        //         user_buy = listing.user;
        //         user_sell = this;
        //     }
        //     else if(listing.buy == false){
        //         user_buy = this;
        //         user_sell = listing.user;
        //     }
        //     else{
        //         throw "buy parameter of listing with id " + listing.id + "must be true or false"
        //     }
        // }
        // var transaction = new Transaction(listing.id, user_buy, user_sell, listing);
        // listing.transaction_id = transaction.id;
        // return transaction;
        //update transaction_id in listing with new transaction_id
        //note we only store successful transactions, thus we delay pushing transaction to database until it has completed

    }
}