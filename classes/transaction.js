var Conversation = require("./conversation.js");

//Transactions Database Schema:
//{_id, title, description, user_id_buy, user_id_sell, listing_id, conversation, user_buy_will_initiate, ...
//...user_sell_will_initiate, user_buy_confirm_met_up, user_sell_confirm_met_up}
//TODO:
//transaction is saved to database when it has been terminated
//note create the transaction before deleting a listing
//note if we had to recreate transaction object from database, we would need a parameter for conversation as well
//should users be able to offer their own lower price?
var Transaction = function() {
    function Transaction(user_id_buy, user_id_sell, listing) {
        //this._id (this is assigned when transaction retrieved from database)
        //TODO: should user references be references or ids? ids are easier to save on database
        //TODO: transaction is automatically converted to JSON by JSON.stringify
        //TODO: we store id's rather than references since saving a reference to a database is storing redundant info
        //TODO: we can easily look up any id in the 'active' data structure or if not present then in the database
        //if the above two are null or if listing is null/undefined then transaction fails, ie every transaction must be created
        //from an active listing
        if (listing == null || listing == undefined) {
            throw "transaction cannot be created from a listing that is " + listing;
        }
        this.title = listing.title; //copy over from listing (since listing will be deleted from active_listings
        this.description = listing.description; //copy over from listing (since listing will be deleted from active_listings
        this.price = listing.price
        this.user_id_buy = user_id_buy; //_id of User
        this.user_id_sell = user_id_sell; //_id of Seller
        this.listing_id = listing._id; //listing_id
        this.conversation = new Conversation();
        if (listing.buy == true) {
            this.user_buy_accept_request = null;
            this.user_sell_accept_request = true;
        }
        else {
            this.user_buy_accept_request = true;
            this.user_sell_accept_request = null;
        } //booling containing with user_buy and user_sell have accepted the request, user that creates the transaction will
        // set the bool to yes automatically
        this.user_buy_confirm_met_up = null; //whether buyer confirms that transaction has been completed, null = not accepted, true = accepted, false = declined
        this.user_sell_confirm_met_up = null; //whether buyer confirms that transaction has been completed, null = not accepted, true = accepted, false = declined
        //in both initiate and confirm_meet_up any false indicates the transaction was canceled by one party
    }

    function verifyTransactionNotActivatedThenSetAcceptRequest(user_id, value) {
        if (this.user_buy_accept_request == null && this.user_sell_accept_request != null) {
            if (this.user_id_buy == user_id) {
                this.user_buy_accept_request = value;
            }
            else {
                throw "the user_id " + this.user_id_buy + " associated with this transaction doesn't match the user id of the" +
                " user that is accepting the tranasction " + user_id
            }
        }

        else if (this.user_buy_accept_request != null && this.user_sell_accept_request == null) {
            if (this.user_id_sell == user_id) {
                this.user_sell_accept_request = value;
            }
            else {
                throw "the user_id " + this.user_id_buy + " associated with this transaction doesn't match the user id of the" +
                " user that is accepting the transaction " + user_id
            }
        }
        else {
            throw "transaction with id " + this._id + "has already been accepted or declined"
            return;
        }
    }

    function verifyTransactionActiveThenSetConfirmed(user_id, value){
        if(this.isActive()){
            if(this.user_id_buy == user_id){
                this.user_buy_confirm_met_up = value;
            }
            else if(this.user_id_sell == user_id){
                this.user_sell_confirm_met_up = value;
            }
            else{
                throw "the user id " + user_id + " that is attempting to confirm the transaction with id " + this._id +
                "doesn't match buyer id or seller id";
            }
        }
        else{
            throw "tried to confirm transaction with id " + this._id + " but transaction is not active";
        }
    }

    //TODO: what if there are multiple transaction requests on the same listing?
    Transaction.prototype = {
        constructor: Transaction,
        initFromDatabase: function (transaction) {
            this._id = transaction._id
            this.title = transaction.title;
            this.description = transaction.description;
            this.price = transaction.price
            this.user_id_buy = transaction.user_id_buy;
            this.user_id_sell = transaction.user_id_sell; //_id of Seller
            this.listing_id = transaction.listing_id; //listing_id
            this.conversation = transaction.conversation;
            this.accepted = transaction.accepted;
            this.user_buy_accept_request = transaction.user_buy_accept_request;
            this.user_sell_accept_request = transaction.user_sell_accept_request;
            this.user_buy_confirm_met_up = transaction.user_buy_confirm_met_up;
            this.user_sell_confirm_met_up = transaction.user_sell_confirm_met_up;
        },
        sendMessage: function (text, username) {
            //sends a message to the current conversation
            //current_transaction cannot be null
            if (this.conversation == null) {
                throw "tried to send message to null Conversation";
            }
            //(Message(text, username, time_sent)
            var message = new Message(text, username, new Date());
            this.conversation.send_message(message);
        },
        //TODO: the below modifications should be done atomically so as the avoid race conditions
        //both buy and sell user_id are defined at transaction creation
        //1. verify that exactly one user_accept_request bool is null, i.e transaction hasn't already been started
        //2. verify that one of the user_accept_requests is null and set that to true
        acceptRequest: function (user_id) {
            //TODO: check whether user_id is of buyer or of seller, then set the appropriate accept_request value
            verifyTransactionNotActivatedThenSetAcceptRequest(user_id, true)
        },

        //throws error if transaction has already been accepted or declined
        declineRequest: function (user_id) {
            //TODO: check whether user_id is of buyer or of seller, then set the appropriate accept_request value
            verifyTransactionNotActivatedThenSetAcceptRequest(user_id, false);
        },

        confirm: function (user_id) {
            //TODO: throw error if user_id doesn't match one of the two user_ids of the transactions
            //TODO: set the confirm to true for the appropriate user
            verifyTransactionActiveThenSetConfirmed(user_id, true);
        },
        reject: function (user_id) {
            //TODO: throw error if user_id doesn't match one of the two user_ids of the transactions
            //TODO: set the confirm to false for the appropriate user
            verifyTransactionActiveThenSetConfirmed(user_id, false);
        },
        //returns whether transaction has been initiated
        isActive: function () {
            var accepted = this.user_buy_accept_request && this.user_sell_accept_request
            var notRejected =  this.user_buy_confirm_met_up != false && this.user_sell_confirm_met_up != false;
            var notConfirmed = !(this.user_buy_confirm_met_up == true && this.user_sell_confirm_met_up == true);
            return accepted && notRejected && notConfirmed;
        },
        //TODO: watch out for when both users confirm at the same time.
        isConfirmed: function () {
            //TODO: if both confirm_met_up are true then return true;
            if (this.user_buy_confirm_met_up == true && this.user_sell_confirm_met_up == true) {
                return true;
            }
            return false;
        },
        isResponseUser: function (user_id) {

        }
    }

    return Transaction;
}();

module.exports = Transaction;
