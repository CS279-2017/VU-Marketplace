var Message = require("./message2.js");

function MessagesCollection(database){
    this.database = database;
    this.collection_messages = database.collection('messages');
}

MessagesCollection.prototype = {
    constructor: MessagesCollection,
    add: function(message, callback, error_handler){
        var collection_messages = this.collection_messages;
        if(message._id == undefined){
            this.collection_messages.insert(message, function (err, count, status) {
                if(err){error_handler(err.message);}
                else{
                    collection_messages.find(message).toArray(function(err, docs){
                        if(docs.length == 1){
                            message.update(docs[0]);
                            if(callback != undefined){ callback(message);}
                        }
                        else{
                            error_handler("more than 1 message inserted into database");
                            return;
                        }
                    });
                }
            });
        }
        else{
            error_handler("You cannot modify an existing message!");
        }
    },
    get: function(message_ids, callback, error_handler){
        if(!(Array.isArray(message_ids))){
            error_handler("message_ids must be an array!")
        }
        var message_id_arr = [];
        for(var i=0; i< message_ids.length; i++){
            message_id_arr.push(toMongoIdObject(message_ids[i].toString()));
        }
        this.collection_messages.find({_id: {$in:message_id_arr}}).toArray(function(err, docs) {
            if(docs.length > 0){
                var messages_arr = [];
                for(var j=0; j< docs.length; j++){
                    var message = new Message();
                    message.update(docs[j]);
                    messages_arr.push(message);
                }
                callback(messages_arr);
            }
            else{
                error_handler("No messages were found");
            }
        });
    },
    getForEmailAddress: function(email_address, callback, error_handler){
        this.collection_messages.find({email_address: email_address}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var message = new Message()
                message.update(docs[0]);
                callback(message);
            }
            else{
                error_handler("Message with email_address " + email_address + " was not found");
            }
        });
    },
    remove: function(_id, callback){

    },
    size: function(){

    },

    getConversation: function(user_id1, user_id2, callback, error_handler){
        this.collection_messages.find(
            {$or:[
                {$and:
                    [{to_user_id: user_id1},
                    {from_user_id: user_id2}]
                },
                {$and:
                    [{to_user_id: user_id2},
                        {from_user_id: user_id1}]
                }
            ]}
        ).toArray(function(err, docs) {
            if(docs.length > 0) {
                var active_messages = [];
                for(var i=0; i<docs.length; i++){
                    var message = new Message();
                    message.update(docs[i]);
                    active_messages.push(message);
                }
                callback(active_messages);
            }
            else{
                callback([])
            }
        });
    },
    //TODO: find some faster way to search messages on socket id, maybe make another hashmap
    // getLastForUserId: function(user_id, callback, error_handler){
    //     this.collection_messages.find({user_id: socket_id}).toArray(function(err, docs) {
    //         if(docs.length > 0) {
    //             var message = new Message();
    //             message.update(docs[0]);
    //             callback(message);
    //         }
    //         else{
    //             callback([])
    //         }
    //     });
    // },
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = MessagesCollection;