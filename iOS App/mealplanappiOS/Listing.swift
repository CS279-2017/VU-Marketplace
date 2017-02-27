//
//  Listing.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/11/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import Foundation

class Listing{
    var _id:String;
    var user_id:String;
    var title:String?;
    var description:String?;
    var location:Location?;
    var creation_time:UInt64;
    var expiration_time:UInt64?;
    var price:Double;
    var buy:Bool?;
    var transaction_id:String?;
    
    var users_name: String?
    
    var picture_ids: [String]?
    
    var first_name: String?
    var last_name: String?
    
    var isbn13: String?
    
    var book: Book?
    
    var buyer_user_ids: [String]?
    
    var active: Bool?
    
    var bought_by_user_id: String?
    
    var sold: Bool?
    
    var time_sold: UInt64?
    
    init(_id:String, user_id:String, title:String, description:String, location: Location, creation_time: UInt64, expiration_time: UInt64, price: Double, buy: Bool, transaction_id:String){
        self._id = _id;
        self.user_id = user_id;
        self.title = title;
        self.description = description;
        self.location = location;
        self.creation_time = creation_time
        self.expiration_time = expiration_time;
        self.price = price
        self.buy = buy;
        self.transaction_id = transaction_id;
    }
    
    init(dictionary: Dictionary<String, Any>){
        self._id = (dictionary["_id"] as? String)!;
        self.user_id = (dictionary["user_id"] as? String)!;
//        self.title = dictionary["title"] as? String;
        self.description = dictionary["description"] as? String;
//        if(dictionary["location"] != nil){
//             self.location = Location(dictionary: (dictionary["location"] as? [String:Any])!);
//        }
        self.creation_time = UInt64(dictionary["creation_time"] as! Double)
//        if(!(dictionary["expiration_time"] is NSNull)){
//            self.expiration_time = UInt64((dictionary["expiration_time"] as? Double)!);
//        }
        self.price = dictionary["price"] as! Double
//        if(!(dictionary["buy"] is NSNull)){
//            self.buy = dictionary["buy"] as? Bool
//        }
        if(dictionary["picture_ids"] != nil && !(dictionary["picture_ids"] is NSNull)){
            self.picture_ids = dictionary["picture_ids"] as! [String]
        }
        
        self.isbn13 = dictionary["isbn13"] as? String
        self.first_name = dictionary["first_name"] as? String
        self.last_name = dictionary["last_name"] as? String
        
        self.book = Book(dictionary: dictionary["book"] as! Dictionary<String, Any>);
        
        self.buyer_user_ids = dictionary["buyer_user_ids"] as? [String]
        
        self.bought_by_user_id = dictionary["bought_by_user_id"] as? String
        
        self.active = dictionary["active"] as? Bool
        
        self.sold = dictionary["sold"] as? Bool
        
        self.time_sold = dictionary["time_sold"] as? UInt64
        //        self.transaction_id = dictionary["transaction_id"] as! String?;
    }
    
    func update(listing: Listing){
        self.title = listing.title
        self.description = listing.description
        self.location = listing.location
        self.expiration_time = listing.expiration_time;
        self.price = listing.price
        self.buy = listing.buy;
        self.picture_ids = listing.picture_ids;
        
    }
}
