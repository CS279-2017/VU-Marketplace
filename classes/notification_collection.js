var Notification = require("./notification2.js");

function NotificationsCollection(database){
    this.database = database;
    this.collection_notifications = database.collection('notifications');
}

NotificationsCollection.prototype = {
    constructor: NotificationsCollection,
    add: function(notification, callback, error_handler){
        var collection_notifications = this.collection_notifications;
        if(notification._id == undefined){
            this.collection_notifications.insert(notification, function (err, count, status) {
                if(err){error_handler(err.notification);}
                else{
                    collection_notifications.find(notification).toArray(function(err, docs){
                        if(docs.length == 1){
                            notification.update(docs[0]);
                            if(callback != undefined){ callback();}
                        }
                        else{
                            error_handler("more than 1 notification inserted into database");
                            return;
                        }
                    });
                }
            });
        }
        else{
            error_handler("You cannot modify an existing notification!");
        }
    },
    get: function(notification_ids, callback, error_handler){
        if(!(Array.isArray(notification_ids))){
            error_handler("notification_ids must be an array!")
        }
        var notification_id_arr = [];
        for(var i=0; i< notification_ids.length; i++){
            notification_id_arr.push(toMongoIdObject(notification_ids[i].toString()));
        }
        this.collection_notifications.find({_id: {$in:notification_id_arr}}).toArray(function(err, docs) {
            if(docs.length > 0){
                var notifications_arr = [];
                for(var j=0; j< docs.length; j++){
                    var notification = new Notification();
                    notification.update(docs[j]);
                    notifications_arr.push(notification);
                }
                callback(notifications_arr);
            }
            else{
                error_handler("No notifications were found");
            }
        });
    },
    getForUserId: function(user_id, callback, error_handler){
        this.collection_notifications.find({to_user_id: user_id}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var notifications_arr = [];
                for(var j=0; j< docs.length; j++){
                    var notification = new Notification();
                    notification.update(docs[j]);
                    notifications_arr.push(notification);
                }
                callback(notifications_arr);
            }
            else{
                error_handler("Notification with email_address " + email_address + " was not found");
            }
        });
    },
    remove: function(_id, callback){

    },
    size: function(){

    },

    getConversation: function(user_id1, user_id2, callback, error_handler){
        this.collection_notifications.find(
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
                var active_notifications = [];
                for(var i=0; i<docs.length; i++){
                    var notification = new Notification();
                    notification.update(docs[i]);
                    active_notifications.push(notification);
                }
                callback(active_notifications);
            }
            else{
                callback([])
            }
        });
    },
    //TODO: find some faster way to search notifications on socket id, maybe make another hashmap
    getNotificationBySocketId: function(socket_id, callback){
        this.collection_notifications.find({socket_id: socket_id}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var notification = new Notification();
                notification.update(docs[0]);
                callback(notification);
            }
            else{
                callback([])
            }
        });
    },
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = NotificationsCollection;