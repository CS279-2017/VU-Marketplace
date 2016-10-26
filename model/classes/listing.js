module.exports = Listing;

//Listing Database Schema:
//{_id, user_id, title, description, location, creation_time, expiration_time, price, buy, transaction_id}
function Listing(user_id, title, description, location, creation_time, expiration_time, price, buy){
    //Listing(id, titile, description, location, creation_time, expiration_time, price, buy)
    //this._id (this will be initialized when listing retrieved from database)
    this.user_id = user;
    this.title = title;
    this.description = description;
    this.location = location;
    this.creation_time = creation_time;
    this.expiration_time = expiration_time;
    this.price = price;
    this.buy = buy; //true or false whether this is a buy listing
    this.transaction_id = null;
}

Listing.prototype = {
    constructor: Listing,
    initFromDatabase: function(_id, user_id_, title, description, location, creation_time_, expiration_time, price, buy, transaction_id){
        this._id = _id;
        this.user_id = user;
        this.title = title;
        this.description = description;
        this.location = location;
        this.creation_time = creation_time;
        this.expiration_time = expiration_time;
        this.price = price;
        this.buy = buy;
        this.transaction_id = transaction_id;
    },
    makeTransaction: function(user_initiate_id){ 
        //user_intitate_id is the id of the user that clicks on the listing i.e initiates the transaction
        if(_id == undefined){
            throw "error, the listing from which we are making a transaction has no id"
        }
        var user_buy_id = this.buy? this.user_id: user_initiate_id; 
        var user_sell_id = this.buy? user_initiate_id: this.user_id;
        return new Transaction(user_buy_id, user_sell_id, this._id)
    },
}