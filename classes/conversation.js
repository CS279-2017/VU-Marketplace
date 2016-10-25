module.exports = Conversation;

function Conversation(){
    this.messages = [];
}

Conversation.prototype = {
    constructor: Conversation,
    send_message: function(message){
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