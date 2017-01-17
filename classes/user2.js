function User(first_name, last_name, password, email_address){
    //TODO: find way to get a unique id that we can then assign the user, probably have to get it by querying the Database
    this._id = undefined;
    this.first_name = first_name;
    this.last_name = last_name;
    if(password != undefined){
        this.password = password;
    }
    this.email_address = email_address

    this.device_token = undefined;
    this.venmo_id = undefined ;
    this.socket_id = undefined;

    this.creation_time = new Date().getTime();

    this.buying_listing_ids = [];
    this.selling_listing_ids = [];

    this.location = undefined;
    this.logged_in = undefined;

    this.active = true;
}

User.prototype = {
    //TODO: add getters for username and email, note: password should never be gotten only used internally in a user object
    constructor: User,
    //initUserFromDatabase initializes a user object based on an object returned from database
    update: function(user){
        if(user._id != undefined){
            this._id = user._id.toString();
        }
        // if(user.password != undefined){
        //     this.password = user.password;
        // }
        if(user.first_name != undefined){
            this.first_name = user.first_name;
        }
        if(user.last_name != undefined){
            this.last_name = user.last_name;
        }
        if(user.email_address != undefined){
            this.email_address = user.email_address;
        }
        if(user.venmo_id != undefined){
            this.venmo_id = user.venmo_id;
        }
        if(user.socket_id != undefined){
            this.socket_id = user.socket_id;
        }
        if(user.active != undefined){
            this.active = user.active;
        }
        // this.location = new Location();
        // this.location.initFromDatabase(user.location);


        if(user.device_token != undefined){
            this.device_token = user.device_token;
        }
        if(user.creation_time != undefined){
            this.creation_time = user.creation_time;
        }
        if(user.last_login_time != undefined){
            this.last_login_time = user.last_login_time;
        }
        if(user.buying_listing_ids != undefined){
            this.buying_listing_ids = user.buying_listing_ids;
        }
        if(user.selling_listing_ids != undefined){
            this.selling_listing_ids = user.selling_listing_ids;
        }
    },

    addBuyingListingId: function(listing_id){
        if(this.buying_listing_ids == undefined){
            this.buying_listing_ids = [];
        }
        this.buying_listing_ids.push(listing_id.toString());
    },
    addSellingListingId: function(listing_id){
        if(this.selling_listing_ids == undefined){
            this.selling_listing_ids = [];
        }
        this.selling_listing_ids.push(listing_id.toString());
    },

}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = User;