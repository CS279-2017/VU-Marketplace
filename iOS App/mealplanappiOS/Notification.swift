//
//  Notification.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/10/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

class Notification{
    var _id: String?;
    var to_user_id: String?;
    var from_user_id: String?;
    var listing_id: String?
    var message: String?;
    var time_sent:UInt64?
    var active: Bool?;
    var viewed: Bool?;

    
    init(dictionary: Dictionary<String, Any>){
        self._id = dictionary["_id"] as? String;
        if((dictionary["to_user_id"] as? String) != nil){
            self.to_user_id = (dictionary["to_user_id"] as? String)!;
        }
        if((dictionary["from_user_id"] as? String) != nil){
            self.from_user_id = (dictionary["from_user_id"] as? String)!;
        }
        if((dictionary["listing_id"] as? String != nil)){
            self.listing_id = (dictionary["listing_id"] as? String)!;
        }
        self.message = dictionary["message"] as? String
        self.time_sent = dictionary["time_sent"] as? UInt64;
        self.active = dictionary["active"] as? Bool
        
        self.viewed = dictionary["viewed"] as? Bool
    }
    
}
