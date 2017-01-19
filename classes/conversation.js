function Conversation(user_id1, user_id2){
    this._id = undefined;
    this.user_id1 = user_id1;
    this.user_id2 = user_id2
    this.messages = [];
    this.time_created = new Date().getTime();
}

Conversation.prototype = {
    constructor: Conversation,
    update: function(conversation){
        if(conversation._id != undefined){
            this._id = conversation._id.toString();
        }
        if(conversation.messages != undefined){
            this.messages = conversation.messages;
        }
        if(conversation.user_id1 != undefined){
            this.user_id1 = conversation.user_id1;
        }
        if(conversation.user_id2 != undefined){
            this.user_id2 != conversation.user_id2;
        }
        if(conversation.time_created != undefined){
            this.time_created = conversation.time_created;
        }
    }
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = Conversation;