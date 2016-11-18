module.exports = User;

//User Database Schema:
//we use all_listing
//{_id, username, password, email_address, venmo_id, current_listing_ids, previous_listing_ids, previous_transaction_ids, all_transaction_ids, location}
//do not include password in User object, use password only to retrieve from database on login
function User(first_name, last_name, password, email){
    //TODO: find way to get a unique id that we can then assign the user, probably have to get it by querying the Database
    //this.id (assigned when retrieved from database)
    // this.username = username;
    this.first_name = first_name;
    this.last_name = last_name;
    this.password = password;
    this.email_address = email
    this.venmo_id = null;
    this.socket_id = null;
    this.current_listings_ids = [];
    // this.previous_listings_ids = []; Rather than storing a copy of previous, just look up in database
    this.current_transactions_ids = [];
    // this.previous_transactions_ids = []; Rather than storing a copy of previous, just look up in database

    this.location = null; // not saved onto db
    this.logged_in = null; //not saved onto db
    this.event_queue = [];
}

User.prototype = {
    //TODO: add getters for username and email, note: password should never be gotten only used internally in a user object
    constructor: User,
    //initUserFromDatabase initializes a user object based on an object returned from database
    initFromDatabase: function(user){
        this._id = user._id;
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.password = user.password;
        this.email_address = user.email_address;
        this.location = user.location;
        this.venmo_id = user.venmo_id;
        this.socket_id = null;
        this.current_listings_ids = user.current_listings_ids;
        // this.previous_listings_ids = user.previous_listings_ids;
        this.current_transactions_ids = user.current_transactions_ids
        // this.previous_transactions_ids = user.previous_transactions_ids;
        
        //initializes the event queue using data passed from database
        if(user.event_queue != undefined) {
            for (var i = 0; i < user.event_queue.count; i++) {
                var event = user.event_queue[i];
                user.event_queue[i] = new Event(event.name, event.message.data, event.message.error);
            }
        }
        this.event_queue = user.event_queue;
    },
    addCurrentListingId: function(current_listing_id){
        this.current_listings_ids.push(current_listing_id.toString());
    },
    removeCurrentListingId: function(current_listing_id){
        var index = this.current_listings_ids.indexOf(current_listing_id.toString());
        if(index <= -1){
            throw {message: "listing id " + current_listing_id + " does not exist in current listing ids of user with id " + this._id};
        }
        this.current_listings_ids.splice(index, 1);
    },
    // addPreviousListingId: function(previous_listing_id){
    //     this.previous_listings_ids.push(previous_listing_id);
    // },
    // removePreviousListingId: function(previous_listing_id){
    //     var index = this.previous_listings_ids.indexOf(previous_listing_id);
    //     if(index <= -1){
    //         throw {message: "listing id " + previous_listing_id + " does not exist in previous listings ids of user with id " + this._id};
    //     }
    //     this.previous_listings_ids.splice(index, 1);
    // },
    addCurrentTransactionId: function(current_transaction_id){
        this.current_transactions_ids.push(current_transaction_id.toString());
    },
    removeCurrentTransactionId: function(current_transaction_id){
        console.log(this);
        var index = this.current_transactions_ids.indexOf(current_transaction_id.toString());
        if(index <= -1){
            throw {message: "transaction id " + current_transaction_id + " does not exist in current transactions ids of user with id " + this._id};
        }
        this.current_transactions_ids.splice(index, 1);
    },
    // addPreviousTransactionId: function(previous_transaction_id){
    //     this.previous_transactions_ids.add(previous_transaction_id);
    // },
    // removePreviousTransactionId: function(previous_transaction_id){
    //     var index = this.previous_transactions_ids.indexOf(previous_transaction_id);
    //     if(index <= -1){
    //         throw {message: "transaction id " + previous_transaction_id+ " does not exist in previous transaction ids of user with id " + this._id};
    //     }
    //     this.previous_transactions_ids.splice(index, 1);
    // },
    // makeListing: function(title, description, location, expiration_time, price, buy){
    //     var creation_time = new Date(); //should we use Date? Can date we converted to JSON and then converted back to date?
    //     // how should we determine id of new listing? should we pass it in as a parameter?
    //     return new Listing (this._id, title, description, location, creation_time, expiration_time, price, buy)
    //     //location might have to be modified into appropriate structure
    // },
    //TODO: make Transaction should call make Transaction on the listing
    // makeTransaction:function(listing){
    //     //TODO:
    //     return listing.makeTransaction(this._id);
    //
    // }

    enqueueEvent: function(event){
        this.event_queue.push(event);
    },
    dequeueEvent: function(){
        var top_event = event_queue[0];
        this.event_queue.shift();
        return top_event;
    }
}