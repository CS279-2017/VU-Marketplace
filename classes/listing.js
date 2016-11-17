//Listing Database Schema:
//{_id, user_id, title, description, location, creation_time, expiration_time, price, buy, transaction_id}
//Listings are removed after they expire, or they are removed manually by the user, or they are removed when a transaction based
//on the listing has started, at the point remove all other transactions based on that listing
var Listing = function() {
    function Listing(user_id, title, description, location, expiration_time, price, buy) {
        //Listing(id, titile, description, location, creation_time, expiration_time, price, buy)
        //this._id (this will be initialized when listing retrieved from database)
        this.user_id = user_id;
        this.title = title;
        this.description = description;
        this.location = location;
        this.creation_time = new Date().getTime();
        this.expiration_time = expiration_time;
        this.price = price;
        this.buy = buy; //true or false whether this is a buy listing
        this.transaction_id = null;
        this.active = true;
    }

    Listing.prototype = {
        constructor: Listing,
        initFromDatabase: function (listing) {
            this._id = listing._id;
            this.user_id = listing.user_id;
            this.title = listing.title;
            this.description = listing.description;
            this.location = listing.location;
            this.creation_time = listing.creation_time;
            this.expiration_time = listing.expiration_time;
            this.price = listing.price;
            this.buy = listing.buy;
            this.transaction_id = listing.transaction_id;
        },
        makeTransaction: function (user_initiate_id) {
            //user_intitate_id is the id of the user that clicks on the listing i.e initiates the transaction
            if (_id == undefined) {
                throw {message: "error, the listing from which we are making a transaction has no id"}
            }
            var user_buy_id = this.buy ? this.user_id : user_initiate_id;
            var user_sell_id = this.buy ? user_initiate_id : this.user_id;
            return new Transaction(user_buy_id, user_sell_id, this._id)
        },
        isExpired: function(){
            if(this.expiration_time <= new Date().getTime()){
                return true;
            }
            return false;
        }
    }

    return Listing;
}();

module.exports = Listing;