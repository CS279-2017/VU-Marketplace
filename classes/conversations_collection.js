var Conversation = require("./conversation.js");
// var MessagesCollection = require("./messages_collection.js");
// var UsersCollection = require("./users_collection.js")

function ConversationsCollection(database){
    this.database = database;
    this.collection_conversations = database.collection('conversations');
    // this.messages_collection = new MessagesCollection(database);
    // this.users_collection = new UsersCollection(database);
}

ConversationsCollection.prototype = {
    constructor: ConversationsCollection,
    getForPairUserIds: function(user_id1, user_id2, callback, error_handler){
        this.collection_conversations.find(
            {$or: [
                {$and:[{user_id1: user_id1.toString()}, {user_id2: user_id2.toString()}]},
                {$and:[{user_id1: user_id2.toString()}, {user_id2: user_id1.toString()}]}
            ]}
        ).toArray(function(err, docs) {
            if(!err){
                if(docs.length > 0){
                    console.log(docs);
                    var conversation = new Conversation();
                    conversation.update(docs[0]);
                    console.log(conversation);
                    callback(conversation);
                }
                else{
                    error_handler("No conversations were found");
                }
            }
            else{
                error_handler("An error occured!")
            }

        });
    },
    getOneToMany: function(user_id, other_user_ids, callback, error_handler){
        if(!(Array.isArray(other_user_ids))){
            other_user_ids = [other_user_ids];
        }
        this.collection_conversations.find(
            {$or: [
                {$and:[{user_id1: {$in: other_user_ids}}, {user_id2: user_id.toString()}]},
                {$and:[{user_id1: user_id.toString()}, {user_id2: {$in: other_user_ids}}]}
            ]}
        ).toArray(function(err, docs) {
            console.log(docs);
            if(docs.length > 0){
                var conversations = [];
                for(var j=0; j< docs.length; j++){
                    var conversation = new Conversation();
                    conversation.update(docs[j]);
                    console.log(docs[j]);
                    console.log(conversation);
                    conversations.push(conversation);
                }
                console.log("conversations_collection.oneToMany result:")
                console.log(conversations);
                callback(conversations);
            }
            else{
                error_handler("No conversations were found");
            }
        });
    },
    addMessage: function(message, callback, error_handler){
        if(message != undefined){
            if(message.to_user_id != undefined && message.from_user_id != undefined){
                this.collection_conversations.update(
                    {$or: [
                        {$and:[{user_id1: message.to_user_id}, {user_id2: message.from_user_id}]},
                        {$and:[{user_id1: message.from_user_id}, {user_id2: message.to_user_id}]}
                    ]},
                    {
                        $push: {messages: message},
                        $setOnInsert: {
                            user_id1: message.from_user_id,
                            user_id2: message.to_user_id,
                            time_created: new Date().getTime()
                        },
                    },
                    {upsert: true},
                    function (err, count, status) {
                        if(err){error_handler(err.message);}
                        else{
                            if(callback != undefined && callback != null){callback();}
                        }
                    }
                );
            }
            else{
                error_handler("message to/from user_ids are undefined");
            }
        }
        else{
            error_handler("message is undefined");
        }
    }

}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = ConversationsCollection;