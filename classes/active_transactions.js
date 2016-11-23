var Transaction = require("./transaction.js");
//current active transactions, adds a transaction to database when a transaction is initiated
//remove transaction from active_transactions when it has completed or has been declined and never intiated
//transactions database contains both complete and incomplete transactions (can use Transaction variables to determine
//the category of a transaction

function ActiveTransactions(){
    this.transactions = {};
}

ActiveTransactions.prototype = {
    constructor: ActiveTransactions,
    initFromDatabase: function(active_transactions){
        for(var i = 0; i<active_transactions.length; i++){
            var new_transaction = new Transaction();
            new_transaction.initFromDatabase(active_transactions[i]);
            this.transactions[new_transaction._id] = new_transaction;
        }
    },
    add: function(transaction){
        this.transactions[transaction._id.toString()] = transaction;
    },
    remove: function(transaction_id){
        delete this.transactions[transaction_id];
    },
    get: function (transaction_id){
        var transaction = this.transactions[transaction_id.toString()];
        // if(typeof transaction == 'undefined'){
        //     console.log("transaction not found: ")
        //     console.log(transaction_id);
        //     console.log(this.transactions)
        //     // throw {message: "active_transactions.get: transaction with id " + transaction_id + " wasn't found"};
        // }
        return transaction;
    },
    size: function(){
        return Object.keys(this.transactions).length
    },
    //gets all transactions involving a user with a given user_id
    //TODO: find a better way to perform these searching functions
    getAllForUser: function(user_id){
        var transactions_arr = [];
        for(transaction_id in this.transactions){
            var transaction = this.transactions[transaction_id];
            if(user_id == transaction.user_id_buy || user_id == transaction.user_id_sell){
                transactions_arr.push(transaction);
            }
        }
        return transactions_arr;
    },
    getAllForListingId: function(listing_id){
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

module.exports = ActiveTransactions;
