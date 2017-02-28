//
//  User.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/1/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//
import UIKit
import Foundation

class User{
    var _id: String?
    var first_name: String?
    var last_name: String?
    var email_address: String?
    
    var venmo_id: String?
    var location: Location?
    var profile_picture: UIImage?
    
    var creation_time: UInt64
    var last_login_time: UInt64?
    
    var buying_listing_ids: [String]?
    var selling_listing_ids: [String]?
    
    var active: Bool?
    
    init(dictionary: Dictionary<String, Any>){
        self._id = dictionary["_id"] as? String;
        self.first_name = dictionary["first_name"] as? String;
        self.last_name = dictionary["last_name"] as? String;
        self.email_address = dictionary["email_address"] as? String;
        
        self.venmo_id = dictionary["venmo_id"] as? String
        print(type(of: dictionary["profile_picture"]));
        if let data = dictionary["profile_picture"] as? Data{
            self.profile_picture = UIImage(data: data)

        }

        self.creation_time = dictionary["creation_time"] as! UInt64;
        
        self.last_login_time = dictionary["last_login_time"] as? UInt64
        
        self.buying_listing_ids = dictionary["buying_listing_ids"] as? [String]
        
        self.selling_listing_ids = dictionary["selling_listing_ids"] as? [String]
        
        self.last_login_time = dictionary["last_login_time"] as? UInt64;
    }
    
    func update(user_info: Dictionary<String, Any>){
        print("user updated!")
        self._id = user_info["_id"] as? String;
        self.first_name = user_info["first_name"] as! String;
        self.last_name = user_info["last_name"] as! String;
        
    }
    
//    func encode(with aCoder: NSCoder) {
//        aCoder.encode(self._id , forKey: "_id");
//        aCoder.encode(self.first_name, forKey: "first_name")
//        aCoder.encode(self.last_name, forKey: "last_name")
//        aCoder.encode(self.email_address, forKey: "email_address")
//        aCoder.encode(self.venmo_id, forKey: "venmo_id")
//        
//        aCoder.encode(self.creation_time, forKey: "creation_time")
//        aCoder.encode(self.buying_listing_ids, forKey: "buying_listing_ids");
//        aCoder.encode(self.selling_listing_ids, forKey: "selling_listing_ids");
//        
//        aCoder.encode(self.last_login_time, forKey: "last_login_time");
//    }
//    
//    required init?(coder aDecoder: NSCoder) {
//        self._id  = aDecoder.decodeObject(forKey: "_id") as? String
//        self.first_name = aDecoder.decodeObject(forKey: "first_name")
//        self.last_name = aDecoder.decodeObject(forKey: "last_name");
//        self.email_address = aDecoder.decodeObject(forKey: "email_address");
//        self.venmo_id = aDecoder.decodeObject(forKey: "venmo_id") as? String
//        self.profile_picture = aDecoder.decodeObject(forKey: "profile_picture") as? UIImage
//        self.first_name = aDecoder.decodeObject(forKey: "first_name") as? String
//        self.last_name = aDecoder.decodeObject(forKey: "last_name") as? String
//        self.device_token = aDecoder.decodeObject(forKey: "device_token") as? String
//    }
}
