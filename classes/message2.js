

function Message(text, from_user_id, to_user_id){
    // this._id = undefined;
    this.text = text;
    this.from_user_id = from_user_id
    this.to_user_id = to_user_id
    this.time_sent = new Date().getTime();
}

Message.prototype = {
    constructor: Message,
    update: function(message){
        if(message._id != undefined){
            this._id = message._id.toString();
        }
        if(message.text != undefined){
            this.text = message.text;
        }
        if(message.from_user_id != undefined){
            this.from_user_id = message.from_user_id;
        }
        if(message.to_user_id != undefined){
            this.to_user_id != message.to_user_id;
        }
        if(message.time_sent != undefined){
            this.time_sent = message.time_sent;
        }
    }
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = Message;
