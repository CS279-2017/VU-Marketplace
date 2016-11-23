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
    sendChatMessage: function(message){
        this.messages.push(message);
    },
    getMessages: function(){
        return this.messages;
    }
}