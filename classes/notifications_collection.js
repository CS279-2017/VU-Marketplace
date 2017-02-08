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
                if(err){error_handler(err.message);}
                else{
                    collection_notifications.find(notification).toArray(function(err, docs){
                        if(docs.length == 1){
                            notification.update(docs[0]);
                            if(callback != undefined){ callback(notification);}
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
    deactivate: function(notification_id, callback, error_handler){
        this.collection_notifications.findOneAndUpdate(
            {_id: toMongoIdObject(notification_id)},
            {$set: {active: false}},
            { new: true },
            function (err, documents) {
                if(!err){
                    callback(documents.value);
                }
                else{
                    error_handler("Failed to deactive notification");
                }
            }
        );
    },
    setAsViewed: function(notification_id, callback, error_handler){
        this.collection_notifications.update({_id: toMongoIdObject(notification_id)},{$set: {viewed: true}}, function (err, count, status) {
            if(!err){
                callback();
            }
            else{
                error_handler("Failed to deactive notification");
            }
        })
    },
    getForUserId: function(user_id, callback, error_handler){
        this.collection_notifications.find({to_user_id: user_id, active: true}).toArray(function(err, docs) {
            if(!err){
                var notifications_arr = [];
                for(var j=0; j< docs.length; j++){
                    var notification = new Notification();
                    notification.update(docs[j]);
                    notifications_arr.push(notification);
                }
                callback(notifications_arr);
            }
            else{
                error_handler("An Error Occured While Retrieving Notifications");
            }
        });
    },
    getNumberOfUnviewedNotifications: function(user_id, callback, error_handler){
        this.collection_notifications.count({to_user_id: user_id, active: true, viewed: false}, function(err, count) {
            if(!err){callback(count);}
            else{ error_handler("an error occured when calling getNumberOfUnviewedNotifications")}
        });
    },
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = NotificationsCollection;