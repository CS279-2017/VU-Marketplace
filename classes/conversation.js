module.exports = Conversation;

function Conversation(conversation){
    if(typeof conversation == 'undefined' || typeof conversation.message == 'undefined') {
        this.messages = [];
    }
    else{
        this.messages = conversation.messages;
    }
}

Conversation.prototype = {
    constructor: Conversation,
    sendMessage: function(message){
        this.messages.push(message);
    },
    convertToJSON: function(){
        return JSON.stringify(this, function( key, value) {
            if(key == 'messages') {
                var ret = [];
                for(var message in this.messages){
                    ret.push(messages.converToJSON())
                }
            }
            else{
                return value;
            }
        });
    }
}