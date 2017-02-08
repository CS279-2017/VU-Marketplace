function User(email_address, password){
    //TODO: find way to get a unique id that we can then assign the user, probably have to get it by querying the Database
    // this._id = undefined;

    if(email_address != undefined){
        var name = parseNameFromEmailVanderbilt(email_address);
        this.first_name = name.first_name;
        this.last_name = name.last_name;
    }

    if(password != undefined){
        this.password = password;
    }
    this.email_address = email_address

    // this.device_token = undefined;
    this.venmo_id = undefined ;
    this.socket_id = undefined;

    this.profile_picture = undefined;

    this.creation_time = new Date().getTime();

    this.buying_listing_ids = [];
    this.selling_listing_ids = [];

    this.location = undefined;
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

        if(user.profile_picture != undefined){
            this.profile_picture = user.profile_picture.buffer;
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

}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

function parseNameFromEmailVanderbilt(email_address){
    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
    email_address = email_address.toLowerCase(); //converts email_address to lower_case because email_addresses are case insensitive
    var first_name;
    var last_name;
    var nameString = email_address.substring(0, email_address.indexOf("@"));
    var nameStringSplit = nameString.split(".");
    if(nameStringSplit.length == 2){
        first_name = nameStringSplit[0];
        last_name = nameStringSplit[1];
    }
    else if(nameStringSplit.length ==3){
        first_name = nameStringSplit[0];
        last_name = nameStringSplit[2];
    }
    else if(nameStringSplit.length == 4){
        first_name = nameStringSplit[0];
        last_name = nameStringSplit[2];
    }
    else{
        error_handler("the vanderbilt email is of invalid format");
        return;
    }
    first_name = first_name.toLowerCase(); //converts first name to lower case
    first_name = first_name.capitalizeFirstLetter(); //then capitalizes first letter
    last_name = last_name.toLowerCase(); //converts last name to lower case
    last_name = last_name.capitalizeFirstLetter(); //then capitalizes first letter
    return {first_name: first_name, last_name: last_name};
}

module.exports = User;