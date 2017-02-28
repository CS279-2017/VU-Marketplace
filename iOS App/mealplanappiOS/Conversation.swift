//
//  Conversation.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/19/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//
import Foundation
class Conversation{
    var _id: String?
    var user_id1:String?
    var user_id2:String?
    var messages = [Message]()
    var creation_time:UInt64?
    var last_message_sent: Message?
    
    var other_user_id: String{
        get {
            if let user_id = UserData.get()?.user_id{
                if(user_id == user_id1){
                    return user_id2!;
                }
                return user_id1!;
            }
            else{
                return user_id1!;
            }
        }
    }
    
    init( user_id1: String, user_id2: String) {
        self.user_id1 = user_id1;
        self.user_id2 = user_id2;
        self.creation_time = UInt64(Date().timeIntervalSince1970) * 1000;
    }
    
    init(dictionary: Dictionary<String, Any>){
        self._id = dictionary["_id"] as? String
        self.user_id1 = dictionary["user_id1"] as? String;
        self.user_id2 = dictionary["user_id2"] as? String;
        let message_dictionary_arr = dictionary["messages"] as? [Dictionary<String, Any>]
        self.messages = [Message]();
        for message_dictionary in message_dictionary_arr!{
            self.messages.append(Message(dictionary: message_dictionary))
        }
        self.creation_time = dictionary["creation_time"] as? UInt64
        
        if let last_message_sent_dictionary = dictionary["last_message_sent"] as? Dictionary<String, Any>{
            self.last_message_sent = Message(dictionary: last_message_sent_dictionary);
        }
    }
}
