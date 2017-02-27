//
//  Message.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/19/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import Foundation

class Message{
    
    var _id: String?
    var text:String
    var from_user_id:String
    var to_user_id: String
    var time_sent:UInt64
    
    init(text: String, to_user_id: String, time_sent: UInt64?) {
        self.text = text;
        self.from_user_id = (UserData.get()?.user_id)!
        self.to_user_id = to_user_id;
        if(time_sent == nil){
            self.time_sent = UInt64(Date().timeIntervalSince1970 * 1000);
        }
        else{
            self.time_sent = time_sent!
        }
    }
    
    init(dictionary: Dictionary<String, Any>){
        self._id = dictionary["_id"] as? String
        self.text = dictionary["text"] as! String;
        self.from_user_id = dictionary["from_user_id"] as! String;
        self.to_user_id = dictionary["to_user_id"] as! String
        self.time_sent = dictionary["time_sent"] as! UInt64
    }
}
