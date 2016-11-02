module.exports = ActiveTransactions;

//current active transactions, adds a transaction to database when a transaction is initiated
//remove transaction from active_transactions when it has completed or has been declined and never intiated
//transactions database contains both complete and incomplete transactions (can use Transaction variables to determine
//the category of a transaction

function ActiveTransactions(){
    this.transactions = {};
}

ActiveTransactions.prototype = {
    constructor: ActiveTransactions,
    add: function(transaction){
        this.transactions[transaction._id] = transaction;
        //TODO:
        //Add transaction to database
    },
    remove: function(transaction_id){
        delete this.transactions[transaction_id];
        //TODO:
        //update transaction in database to make inactive
    },
    get: function (transaction_id){
        return this.transactions[transaction_id];
    }
    ,
    //gets all transactions involving a user with a given user_id 
    getTransactionsForUser: function(user_id){
        var transactions_arr = [];
        for(transaction_id in this.transactions){
            var transaction = this.transactions[transaction_id];
            if(user_id == transaction.user_id_buy || user_id == transaction.user_id_sell){
                transactions_arr.push(transaction);
            }
        }
        return transactions_arr;
    },
    getTransactionsForListingId: function(listing_id){
        var transactions_arr = [];
        for(transaction_id in this.transactions){
            var transaction = this.transactions[transaction_id];
            if(transaction.listing_id == listing_id){
                transactions_arr.push(transaction);
            }
        }
        return transactions_arr;
    },
    //returns an array of all the transactions
    getAll: function(){
        var transactions_arr = [];
        for(key in this.transactions){
            transactions_arr.push(this.transactions[key]);
        }
        return transactions_arr;
    },
    //clears the active_transactions, for testing purposes
    clear: function() {
        this.transactions = {};
    },
}