var SearchQuery = require("./search_query.js");

function SearchQueriesCollection(database){
    this.database = database;
    this.collection_search_queries = database.collection('search_queries');
}

SearchQueriesCollection.prototype = {
    constructor: SearchQueriesCollection,
    add: function(search_query, callback, error_handler){
        var collection_search_queries = this.collection_search_queries;
        if(search_query._id == undefined){
            this.collection_search_queries.insert(search_query, function (err, count, status) {
                if(err){error_handler(err.search_query);}
                else{
                    collection_search_queries.find(search_query).toArray(function(err, docs){
                        if(docs.length == 1){
                            search_query.update(docs[0]);
                            if(callback != undefined){ callback(search_query);}
                        }
                        else{
                            error_handler("more than 1 search_query inserted into database");
                            return;
                        }
                    });
                }
            });
        }
        else{
            error_handler("You cannot modify an existing search_query!");
        }
    },
    get: function(search_query_ids, callback, error_handler){
        if(!(Array.isArray(search_query_ids))){
            error_handler("search_query_ids must be an array!")
        }
        var search_query_id_arr = [];
        for(var i=0; i< search_query_ids.length; i++){
            search_query_id_arr.push(toMongoIdObject(search_query_ids[i].toString()));
        }
        this.collection_search_queries.find({_id: {$in:search_query_id_arr}}).toArray(function(err, docs) {
            if(docs.length > 0){
                var search_queries_arr = [];
                for(var j=0; j< docs.length; j++){
                    var search_query = new SearchQuery();
                    search_query.update(docs[j]);
                    search_queries_arr.push(search_query);
                }
                callback(search_queries_arr);
            }
            else{
                error_handler("No search_queries were found");
            }
        });
    },
    getForEmailAddress: function(email_address, callback, error_handler){
        this.collection_search_queries.find({email_address: email_address}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var search_query = new SearchQuery()
                search_query.update(docs[0]);
                callback(search_query);
            }
            else{
                error_handler("SearchQuery with email_address " + email_address + " was not found");
            }
        });
    },
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = SearchQueriesCollection;