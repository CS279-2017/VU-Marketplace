var Chat = require("./chat.js");
var MessagesCollection = require("./messages_collection.js");
var UsersCollection = require("./users_collection.js")

function ChatCollection(database){
    this.database = database;
    this.messages_collection = new MessagesCollection(database);
    this.users_collection = new UsersCollection(database);
}

ChatCollection.prototype = {
    constructor: ChatCollection,
    get: function(user_id, other_user_ids, callback, error_handler){
        if(!(Array.isArray(other_user_ids))){
            other_user_ids = [other_user_ids];
        }
        var user_id_arr = [];
        for(var i=0; i< other_user_ids.length; i++){
            user_id_arr.push(toMongoIdObject(other_user_ids[i].toString()));
        }
        this.users_collection.get(other_user_ids, function(users){
            this.messages_collection.get()
        }, error_handler)
    },
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = ChatCollection;