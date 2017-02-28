//
//  Transaction.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/11/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import Foundation

class Transaction{
    var _id:String;
    var listing_id: String;
    
    var title: String?
    var description: String?
    var author_names: String?
    var price: Double?;

    var location:Location?;
    var creation_time: UInt64;
    var buyer_user_id:String;
    var seller_user_id: String;
    var buy:Bool?;
//    var conversation:Conversation;
    var buyer_accepted_request:Any? //can be true, false or NSNull
    var seller_accepted_request:Any?
    var buyer_confirmed_meet_up:Any?
    var seller_confirmed_meet_up:Any?
    var end_time: Any?
    
    var offer: Double?
    
    var expiration_time: UInt64?
    
    var buyer_first_name: String?
    var buyer_last_name: String?
    var buyer_venmo_id: String?
    
    var seller_first_name: String?
    var seller_last_name: String?
    var seller_venmo_id: String?
    
    
    init(_id: String, title:String, description:String, location:Location, creation_time: UInt64, price:Double, buyer_user_id: String, seller_user_id:String, buy:Bool, listing_id:String, conversation: Conversation, buyer_accepted_request: Any, seller_accepted_request: Any, buyer_confirmed_meet_up: Any, seller_confirmed_meet_up:Any, end_time: Any){
        print("Transaction initializer called");
        print(_id);
        self._id = _id
//        self.title = title;
//        self.description = description;
        self.location = location;
        self.creation_time = creation_time
//        self.price = price
        self.buyer_user_id = buyer_user_id;
        self.seller_user_id = seller_user_id; //_id of Seller
//        self.buy = buy
        self.listing_id = listing_id; //listing_id
//        self.conversation = conversation;
        self.buyer_accepted_request = buyer_accepted_request;
        self.seller_accepted_request = seller_accepted_request;
        self.buyer_confirmed_meet_up = buyer_confirmed_meet_up;
        self.seller_confirmed_meet_up = seller_confirmed_meet_up;
        self.end_time = end_time;
    }
    
    init(dictionary: Dictionary<String, Any>){
        self._id = dictionary["_id"] as! String;
        self.listing_id = dictionary["listing_id"] as! String;
        
        self.title = dictionary["title"] as? String;
        self.description = dictionary["description"]
            as? String;
        self.price = dictionary["price"] as? Double
        self.author_names = dictionary["author_names"] as? String

        
//        self.location = Location(dictionary: dictionary["location"] as? [String:Any])
        self.creation_time = UInt64(dictionary["creation_time"] as! Double)
        self.buyer_user_id = dictionary["buyer_user_id"] as! String;
        self.seller_user_id = dictionary["seller_user_id"] as! String;
//        self.buy = dictionary["buy"] as! Bool
//        self.conversation = Conversation(dictionary: dictionary["conversation"] as! Dictionary<String, Any>);
        self.buyer_accepted_request = dictionary["buyer_accepted_request"] as? Any;
        self.seller_accepted_request = dictionary["seller_accepted_request"] as? Any;
//        self.buyer_confirmed_meet_up = dictionary["buyer_confirmed_meet_up"] as? Any;
//        self.seller_confirmed_meet_up = dictionary["seller_confirmed_meet_up"] as? Any;
        
        self.end_time = dictionary["end_time"] as Any;
        
        self.offer = dictionary["offer"] as? Double
        
        self.expiration_time = dictionary["expiration_time"] as? UInt64
        
        self.buyer_first_name = dictionary["buyer_first_name"] as? String
        self.buyer_last_name = dictionary["buyer_last_name"] as? String
        self.buyer_venmo_id = dictionary["buyer_venmo_id"] as? String
        
        self.seller_first_name = dictionary["seller_first_name"] as? String
        self.seller_last_name = dictionary["seller_last_name"] as? String
        self.seller_venmo_id = dictionary["seller_venmo_id"] as? String
        
        self.author_names = dictionary["author_names"] as? String
        
    }
    
    func sendChatMessage(message: Message){
//        conversation.sendChatMessage(message: message);
    }
    
    func getOtherUserId()->String?{
        if let my_user_id = UserData.get()?.user_id{
            if(my_user_id == buyer_user_id){
                return seller_user_id
            }
            else{
                return buyer_user_id;
            }
        }
        print("user isn't logged in, must be logged in to view/interact with transactions")
        return nil;
    }
    
    func isUserTheBuyer() -> Bool? {
        if let my_user_id = UserData.get()?.user_id{
            if(my_user_id == buyer_user_id){
                return true;
            }
            else{
                return false;
            }
        }
        else{
            print("user isn't logged in, must be logged in to view/interact with transactions")
            return false;
        }
    }
    
    func hasBeenAcceptedOrDeclined() -> Bool{
        if(buyer_accepted_request is NSNull || seller_accepted_request is NSNull){
            return false;
        }
        return true;
//        return buyer_accepted_request! as! Bool && seller_accepted_request! as! Bool;
    }
    
    func hasBeenAccepted() -> Bool{
        if(buyer_accepted_request is NSNull || seller_accepted_request is NSNull){
            return false;
        }
        return buyer_accepted_request as! Bool && seller_accepted_request as! Bool;
    }
    
    func isActive() -> Bool{
        if(buyer_accepted_request is NSNull || seller_accepted_request is NSNull){
            return false;
        }
        if(buyer_confirmed_meet_up is NSNull || seller_confirmed_meet_up is NSNull){
            if(!(buyer_confirmed_meet_up is NSNull)){
                if(buyer_confirmed_meet_up as! Bool == false){
                    return false;
                }
            }
            if(!(seller_confirmed_meet_up is NSNull)){
                if(seller_confirmed_meet_up as! Bool == false){
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    
    func isTerminated() -> Bool{
        if((!(self.buyer_confirmed_meet_up is NSNull) && self.buyer_confirmed_meet_up as! Bool == false) || (!(self.seller_confirmed_meet_up is NSNull) && self.seller_confirmed_meet_up as! Bool == false)){
            return true;
        }
        return false;
    }
    
    func isCompleted() -> Bool{
        if((!(self.buyer_confirmed_meet_up is NSNull) && self.buyer_confirmed_meet_up as! Bool == true) && (!(self.seller_confirmed_meet_up is NSNull) && self.seller_confirmed_meet_up as! Bool == true)){
            return true;
        }
        return false;
    }
    
    //returns user_id of user that terminated transaction, if not termianted returns nil
    func getTerminatingUserId() -> String?{
        if(!(buyer_confirmed_meet_up is NSNull) && buyer_confirmed_meet_up as! Bool == false){
           return buyer_user_id
        }
        else if (!(seller_confirmed_meet_up is NSNull) && seller_confirmed_meet_up as! Bool == false){
            return seller_user_id
        }
        else{
            return nil;
        }

    }
    
}
