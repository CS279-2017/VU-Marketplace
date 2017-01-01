var Transaction = require("./transaction.js");
//current active transactions, adds a transaction to database when a transaction is initiated
//remove transaction from active_transactions when it has completed or has been declined and never intiated
//transactions database contains both complete and incomplete transactions (can use Transaction variables to determine
//the category of a transaction

function ActiveTransactions(){
    this.transactions_id_to_transaction_map = {};

    this.user_id_to_transactions_map = {};
    this.transaction_id_to_user_id_map = {};

    this.listing_id_to_transactions_map = {};
    this.transaction_id_to_listing_id_map = {};
}

ActiveTransactions.prototype = {
    constructor: ActiveTransactions,
    initFromDatabase: function(active_transactions){
        for(var i = 0; i<active_transactions.length; i++){
            var new_transaction = new Transaction();
            new_transaction.initFromDatabase(active_transactions[i]);
            this.add(new_transaction);
        }
    },
    add: function(new_transaction){
        this.transactions_id_to_transaction_map[new_transaction._id.toString()] = new_transaction;

        if(this.user_id_to_transactions_map[new_transaction.buyer_user_id.toString()] == undefined){
            this.user_id_to_transactions_map[new_transaction.buyer_user_id.toString()] = [];
        }
        this.user_id_to_transactions_map[new_transaction.buyer_user_id.toString()].push(new_transaction);


        if(this.user_id_to_transactions_map[new_transaction.seller_user_id.toString()] == undefined){
            this.user_id_to_transactions_map[new_transaction.seller_user_id.toString()] = [];
        }
        this.user_id_to_transactions_map[new_transaction.seller_user_id.toString()].push(new_transaction);

        if(this.transaction_id_to_user_id_map[new_transaction._id.toString()] == undefined){
            this.transaction_id_to_user_id_map[new_transaction._id.toString()] = [];
        }
        this.transaction_id_to_user_id_map[new_transaction._id.toString()].push(new_transaction.buyer_user_id.toString());
        this.transaction_id_to_user_id_map[new_transaction._id.toString()].push(new_transaction.seller_user_id.toString());

        //every transaction has two users, but every user can have mutliple transactions

        if(this.listing_id_to_transactions_map[new_transaction.listing_id.toString()] == undefined){
            this.listing_id_to_transactions_map[new_transaction.listing_id.toString()] = [];
        }
        this.listing_id_to_transactions_map[new_transaction.listing_id.toString()].push(new_transaction);
        //there can be multiple transactions per listing

        this.transaction_id_to_listing_id_map[new_transaction._id.toString()] = new_transaction.listing_id.toString();
        //but every transaction can only have 1 listing
    },
    remove: function(transaction_id){
        // delete this.transactions_id_to_transaction_map[transaction_id.toString()];

        var user_id1 = this.transaction_id_to_user_id_map[transaction_id.toString()][0];
        var user_id2 = this.transaction_id_to_user_id_map[transaction_id.toString()][1];
        delete this.transaction_id_to_user_id_map[transaction_id.toString()];


        var user1_transactions = this.user_id_to_transactions_map[user_id1.toString()];
        var index = user1_transactions.indexOf(transaction_id.toString());
        if (index > -1) { user1_transactions.splice(index, 1);}
        if(user1_transactions.length == 0){delete this.user_id_to_transactions_map[user_id1.toString()];}


        var user2_transactions = this.user_id_to_transactions_map[user_id2.toString()];
        var index = user2_transactions.indexOf(transaction_id.toString());
        if (index > -1) { user2_transactions.splice(index, 1);}
        if(user2_transactions.length == 0){delete this.user_id_to_transactions_map[user_id2.toString()];}

        var listing_id = this.transaction_id_to_listing_id_map[transaction_id.toString()];
        delete this.transaction_id_to_listing_id_map[transaction_id.toString()];

        var listing_transactions = this.listing_id_to_transactions_map[listing_id];
        var index = listing_transactions.indexOf(transaction_id.toString());
        if (index > -1) { listing_transactions.splice(index, 1);}
        if(listing_transactions.length == 0){delete this.listing_id_to_transactions_map[listing_id.toString()];}




        // this.user_id_to_transactions_map[new_transaction.buyer_user_id].push(new_transaction);
        //
        // if(this.user_id_to_transactions_map[new_transaction.seller_user_id] == undefined){
        //     this.user_id_to_transactions_map[new_transaction.seller_user_id] = [];
        // }
        // this.user_id_to_transactions_map[new_transaction.seller_user_id].push(new_transaction);
        //
        // if(this.listing_id_to_transactions_map[new_transaction.listing_id] == undefined){
        //     this.listing_id_to_transactions_map[new_transaction.listing_id] = [];
        // }
        // this.listing_id_to_transactions_map[new_transaction.listing_id].push(new_transaction);
    },
    get: function (transaction_id){
        return this.transactions_id_to_transaction_map[transaction_id.toString()];
        // if(typeof transaction == 'undefined'){
        //     console.log("transaction not found: ")
        //     console.log(transaction_id);
        //     console.log(this.transactions)
        //     // throw {message: "active_transactions.get: transaction with id " + transaction_id + " wasn't found"};
        // }
    },
    size: function(){
        return Object.keys(this.transactions_id_to_transaction_map).length
    },
    //gets all transactions involving a user with a given user_id
    //TODO: find a better way to perform these searching functions
    getAllForUser: function(user_id){
        // var transactions_arr = [];
        // for(transaction_id in this.transactions_id_to_transaction_map) {
        //     var transaction = this.transactions_id_to_transaction_map[transaction_id];
        //     if (user_id == transaction.buyer_user_id || user_id == transaction.seller_user_id) {
        //         transactions_arr.push(transaction);
        //
        //     }
        // }
        // return transactions_arr;
        var transactions =  this.user_id_to_transactions_map[user_id];
        if(transactions == undefined){ return []; }
        return transactions;
    },
    getAllForListingId: function(listing_id){
        // var transactions_arr = [];
        // // for(transaction_id in this.transactions_id_to_transaction_map){
        // //     var transaction = this.transactions_id_to_transaction_map[transaction_id];
        // //     // console.log(transaction)
        // //     if(transaction.listing_id == listing_id){
        // //         transactions_arr.push(transaction);
        // //     }
        // // }
        // return transactions_arr;
        var transactions = this.listing_id_to_transactions_map[listing_id];
        if(transactions == undefined){ return []; }
        return transactions;

    },
    //returns an array of all the transactions
    getAll: function(){
        var transactions_arr = [];
        for(key in this.transactions_id_to_transaction_map){
            transactions_arr.push(this.transactions_id_to_transaction_map[key]);
        }
        return transactions_arr;
    },
    //clears the active_transactions, for testing purposes
    clear: function() {
        this.transactions_id_to_transaction_map = {};

        this.user_id_to_transactions_map = {};
        this.transaction_id_to_user_id_map = {};

        this.listing_id_to_transactions_map = {};
        this.transaction_id_to_listing_id_map = {};
    },
}

module.exports = ActiveTransactions;
