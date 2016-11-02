module.exports = Transaction;

//Transactions Database Schema:
//{_id, title, description, user_id_buy, user_id_sell, listing_id, conversation, user_buy_will_initiate, ...
//...user_sell_will_initiate, user_buy_confirm_met_up, user_sell_confirm_met_up}
//TODO:
//transaction is saved to database when it has been terminated
//note create the transaction before deleting a listing
//note if we had to recreate transaction object from database, we would need a parameter for conversation as well
//should users be able to offer their own lower price?
function Transaction(user_id_buy, user_id_sell, listing){
    //this._id (this is assigned when transaction retrieved from database)
    //TODO: should user references be references or ids? ids are easier to save on database
    //TODO: transaction is automatically converted to JSON by JSON.stringify
    //TODO: we store id's rather than references since saving a reference to a database is storing redundant info
    //TODO: we can easily look up any id in the 'active' data structure or if not present then in the database
    //if the above two are null or if listing is null/undefined then transaction fails, ie every transaction must be created
    //from an active listing
    if(listing == null || listing == undefined){
        throw "transaction cannot be created from a listing that is "+listing;
    }
    this.title = listing.title; //copy over from listing (since listing will be deleted from active_listings
    this.description = listing.description; //copy over from listing (since listing will be deleted from active_listings
    this.price = listing.price
    this.user_id_buy = user_id_buy; //_id of User
    this.user_id_sell = user_id_sell; //_id of Seller
    this.listing_id = listing._id; //listing_id
    this.conversation = new Conversation();
    this.accepted = null; //whether the listing owner agrees to begin transaction, true = yes, false = no, null = not responded yet
    this.user_buy_confirm_met_up = null; //whether buyer confirms that transaction has been completed, null = not accepted, true = accepted, false = declined
    this.user_sell_confirm_met_up = null; //whether buyer confirms that transaction has been completed, null = not accepted, true = accepted, false = declined
    //in both initiate and confirm_meet_up any false indicates the transaction was canceled by one party
}

//TODO: what if there are multiple transaction requests on the same listing?
Transaction.prototype = {
    constructor: Transaction,
    initFromDatabase: function(transaction){
        this._id = transaction._id
        this.title = transaction.title;
        this.description = transaction.description;
        this.price = transaction.price
        this.user_id_buy = transaction.user_id_buy;
        this.user_id_sell = transaction.user_id_sell; //_id of Seller
        this.listing_id = transaction.listing_id; //listing_id
        this.conversation = transaction.conversation;
        this.accepted = transaction.accepted;
        // this.user_buy_accept_request = transaction.user_buy_accept_request;
        // this.user_sell_accept_request = transaction.user_sell_accept_request;
        this.user_buy_confirm_met_up = transaction.user_buy_confirm_met_up;
        this.user_sell_confirm_met_up =  transaction.user_sell_confirm_met_up;
    },
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
    //TODO: the below modifications should be done atomically so as the avoid race conditions
    //both buy and sell user_id are defined at transaction creation
    acceptRequest: function(){
        //TODO: check whether user_id is of buyer or of seller, then set the appropriate accept_request value
        if(this.accepted != null){
            throw "transaction with id " + this._id + "has already been accepted or declined"
            return;
        }
        this.accepted = true;
    },

    //throws error if transaction has already been accepted or declined
    declineRequest: function(){
        //TODO: check whether user_id is of buyer or of seller, then set the appropriate accept_request value
        if(this.accepted != null){
            throw "transaction with id " + this._id + "has already been accepted or declined"
            return;
        }
        this.accepted = false;
    },
    
    confirm: function(user_id){
        //TODO: throw error if user_id doesn't match one of the two user_ids of the transactions
        //TODO: set the confirm to true for the appropriate

    },
    reject: function(user_id){
        //TODO: throw error if user_id doesn't match one of the two user_ids of the transactions
        //TODO: set the confirm to false for the appropriate_user
    },
    //returns whether transaction has been initiated
    hasAccepted: function(){
        //TODO: if both initiated boolean values are true then has started
        if(this.accepted == true){
            return true;
        }
        return false;
    },
    //TODO: watch out for when both users confirm at the same time. 
    bothUsersHaveConfirmed: function(){
        //TODO: if both confirm_met_up are true then return true;
        if(this.user_buy_confirm_met_up == true && this.user_sell_confirm_met_up == true){
            return true;
        }
        return false;
    },
}