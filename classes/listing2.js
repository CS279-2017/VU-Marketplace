function Listing(user_id, book, description, price) {
    //Listing(id, titile, description, location, creation_time, expiration_time, price, buy)
    //this._id (this will be initialized when listing retrieved from database)
    // this._id = undefined;
    this.user_id = user_id;
    this.book = book;
    this.price = price;

    if(book != undefined){
        this.isbn13 = book.isbn13;
    }

    this.creation_time = new Date().getTime();
    // this.title = title;
    this.description = description;
    // this.author_names = author_names;
    // this.price = price;

    this.active = true;
    this.deactivated_time = undefined;
    this.picture_ids = [];
    this.buyer_user_ids = [];

    this.bought_by_user_id = undefined;
}

Listing.prototype = {
    constructor: Listing,
    update: function (listing) {
        if(listing._id != undefined){
            this._id = listing._id.toString();
        }
        if(listing.user_id != undefined){
            this.user_id = listing.user_id;
        }
        if(listing.book != undefined){
            this.book = listing.book;
        }
        if(listing.description != undefined){
            this.description = listing.description;
        }
        if(listing.price != undefined){
            this.price = listing.price;
        }

        if(listing.isbn13 != undefined){
            this.isbn13 = listing.isbn13;
        }
        if(listing.creation_time != undefined){
            this.creation_time = listing.creation_time;
        }
        if(listing.active != undefined){
            this.active = listing.active;
        }
        if(listing.deactivated_time != undefined){
            this.deactivated_time = this.deactivated_time;
        }
        if(listing.buyer_user_ids != undefined){
            this.buyer_user_ids = listing.buyer_user_ids;
        }

        if(listing.first_name != undefined){
            this.first_name = listing.first_name;
        }
        if(listing.last_name != undefined){
            this.last_name = listing.last_name;
        }
        if(listing.bought_by_user_id != undefined){
            this.bought_by_user_id = listing.bought_by_user_id
        }

    },
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = Listing;