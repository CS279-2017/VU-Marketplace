//
//  DataStore.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/9/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import Foundation
import SocketIO

//Singleton that manages all of the data used by the app

class DataStore{
    //storfes the shared singleton instance of the DataStore class
    static var sharedInstance: DataStore? = nil;
    
    var socket:SocketIOClient;
    var socket_connected: Bool{
        get {
            return socket.status == SocketIOClientStatus.connected;
        }
    }
    
    var bookCoverImageDictionary = [String: UIImage]();
    
    //get the singleton instance if it exists, otherwise call constructor and make an instance
    static func get() -> DataStore{
        if(sharedInstance == nil){
            sharedInstance = DataStore();
        }
        return sharedInstance!;
    }
    
    //COLORS:
    let elephantGray = UIColor(colorLiteralRed: 120/255, green: 144/255, blue: 156/255, alpha: 1.0);
    let elephantLightGray = UIColor(colorLiteralRed: 176/255, green: 191/255, blue: 198/255, alpha: 1.0)
    let elephantDarkGray = UIColor(colorLiteralRed: 86/255, green: 110/255, blue: 120/255, alpha: 1.0)
    let defaultTintBlue = UIColor(colorLiteralRed: 0, green: 122/255, blue: 1.0, alpha: 1.0)
    let placeHolderColor = UIColor(colorLiteralRed: 199/255, green: 199/255, blue: 204/255, alpha: 1.0)
    
    let transactionRequestResponseTime: UInt64 = 24 * 60;
    
    let maxPicturesPerListing = 25;
    
    let maxPictureSize = 700000;
    
    let maxResultsSearchResults = 25;
    let maxResultsListings = 25;
    
    let jpegCompressionRatio:CGFloat = 0.10;

    
    var controllerDictionary = [String: UIViewController]();
    
//    var profilePictureDictionary = [String: UIImage](); //a dictionary of profilePictures cached by user_id
    
    
    var userDictionary = [String: User](); //a dictionary of User objects cached by user_id
    
    var pictureDictionary = [String: UIImage](); //a dictionary of user uploaded pictures cached by picture_id

    
    var currentLocation:Location? //stores the currentLocation of the user, used to calculate distance to listings
    
    var eventListenerDictionary: Dictionary<String, Dictionary<String, UUID>> = [String: [String: UUID]]();
    
    
    
    private init(){
//        self.socket = SocketIOClient(socketURL: URL(string: "http://10.66.247.44:3000/")!, config: [.log(true), .reconnectWait(1)]);
        self.socket = SocketIOClient(socketURL: URL(string: "https://mealplanapp2.herokuapp.com/")!, config: [.log(true), .reconnectWait(1)]);
        socket.connect()
    }

    func login(email_address: String, password: String, callback: @escaping ((User) -> Void), error_handler: @escaping ((String) -> Void)){
        if(socket_connected){
            addListener(listener: {data in
                let user = User(dictionary: data["user"] as! Dictionary<String, Any>)
                UserData.set(user: user);
                UserData.set(password: password);
                callback(user);
            }, forEvent: "login_response", key: "DataStore", error_handler: error_handler)
            
            let device_token = UserData.get()?.device_token
            socket.emit("login", ["email_address": email_address, "password": password, "device_token": device_token]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func authenticate(callback: @escaping (() -> Void), error_handler: @escaping ((String) -> Void)){
        if(socket_connected){
            guard let user_id = UserData.get()?.user_id else { error_handler("no user_id"); return;}
            guard let password = UserData.get()?.password else { error_handler("no password"); return;}
            guard let device_token = UserData.get()?.device_token else { error_handler("no device_token"); return;}
            socket.emit("authenticate", ["user_id": user_id, "password": password, "device_token": device_token]);
            socket.off("authenticate_response");
            socket.on("authenticate_response") {data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("user has been authenticated!")
                    callback();
                }
                else{
//                    showLoginScreen();
                    error_handler(response["error"]! as! String);
                }
            }
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func logout(user_id: String, password: String, callback: @escaping (() -> Void), error_handler: @escaping ((String) -> Void)){
        if(socket_connected){
            //remove the handler before adding to avoid duplicate handlers
            socket.off("logout_response");
            socket.on("logout_response") {data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("user has logged out!")
                    UserData.clear();
                    callback();
                }
                else{
                    error_handler("");
                }
            }
            socket.emit("logout", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    //expiration_time must be double because it is too big for int
    func makeListing(user_id: String, password: String, title: String, description:String, location: [String:Double], expiration_time:Double, price: Double, buy: Bool, callback: @escaping ((Listing) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: {response in
                let listing_dictionary = (response["listing"] as! Dictionary<String, Any>)
                let listing = Listing(dictionary: listing_dictionary)
                callback(listing)
            }, forEvent: "make_listing_response", key: "DataStore", error_handler: error_handler)
            socket.emit("make_listing", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "title": title, "description": description, "location":location, "expiration_time":expiration_time, "price":price, "buy":buy]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func makeListing(book: Book, description: String, price: Double, callback: @escaping ((Listing) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: {response in
                let listing_dictionary = ((response as! Dictionary<String, Any>)["listing"] as! Dictionary<String, Any>)
                let listing = Listing(dictionary: listing_dictionary)
                callback(listing)
            }, forEvent: "make_listing_response", key: "DataStore", error_handler: error_handler)
            socket.emit("make_listing", ["user_id": UserData.get()?.user_id as Any, "password": UserData.get()?.password as Any, "device_token": UserData.get()?.device_token as Any, "book":book.toDictionary(), "description": description, "price":price]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func updateListing(listing_id: String, book: Book, description: String, price: Double, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: {response in
                callback()
            }, forEvent: "update_listing_response", key: "DataStore", error_handler: error_handler)
            socket.emit("update_listing", ["user_id": UserData.get()?.user_id as Any, "password": UserData.get()?.password as Any, "device_token": UserData.get()?.device_token as Any, "listing_id": listing_id, "book":book.toDictionary(), "description": description, "price":price]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func markListingAsSold(listing_id: String, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: {response in
                callback()
            }, forEvent: "mark_listing_as_sold_response", key: "DataStore", error_handler: error_handler)
            socket.emit("mark_listing_as_sold", ["user_id": UserData.get()?.user_id as Any, "password": UserData.get()?.password as Any, "device_token": UserData.get()?.device_token as Any, "listing_id": listing_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func removeListing(user_id: String, password: String, listing_id: String, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("remove_listing_response");
            socket.on("remove_listing_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("remove listing successful!");
                    callback();
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            }
            socket.emit("remove_listing", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "listing_id":listing_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func makeTransactionRequest(user_id: String, password: String, listing_id: String, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void), offer: Double?){
        if(socket_connected){
            socket.off("make_transaction_request_response");
            socket.on("make_transaction_request_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("make transaction request successful!");
                    callback();
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            }
            socket.emit("make_transaction_request", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "listing_id":listing_id, "offer" : offer as Any]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func acceptTransactionRequest(user_id: String, password: String, transaction_id: String, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("accept_transaction_request_response");
            socket.on("accept_transaction_request_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("accept transaction request successful!");
                    callback();
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            }
            socket.emit("accept_transaction_request", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "transaction_id":transaction_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func declineTransactionRequest(user_id: String, password: String, transaction_id: String, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("decline_transaction_request_response");
            socket.on("decline_transaction_request_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("decline transaction request successful!");
                    callback();
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            }
            socket.emit("decline_transaction_request", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "transaction_id":transaction_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func withdrawTransactionRequest(user_id: String, password: String, transaction_id: String, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("withdraw_transaction_request_response");
            socket.on("withdraw_transaction_request_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    callback();
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            }
            socket.emit("withdraw_transaction_request", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "transaction_id":transaction_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func confirmTransaction(user_id: String, password: String, transaction_id: String, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("confirm_transaction_response");
            socket.on("confirm_transaction_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("confirm transaction successful!");
                    callback();
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            }
            socket.emit("confirm_transaction", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any,  "transaction_id":transaction_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func terminateTransaction(user_id: String, password: String, transaction_id: String, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("terminate_transaction_response");
            socket.on("terminate_transaction_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("terminate transaction successful!");
                    callback();
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            }
            socket.emit("terminate_transaction", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "transaction_id":transaction_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func  getAllActivateListings(user_id: String, password: String, callback: @escaping (([Dictionary<String,Any>]) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("get_all_active_listings_response");
            socket.on("get_all_active_listings_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("get all active listings successful")
                    callback((response["data"] as! Dictionary<String, Any>)["all_active_listings"] as! [Dictionary<String, Any>]);
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            };
            socket.emit("get_all_active_listings", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any]);
        }
        else{
            error_handler("Not connected to server")
        }

    }
    
    func getListing(listing_id: String, callback: @escaping ((Listing) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("get_listing_response");
            socket.on("get_listing_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    let listing_dictionary  = (response["data"] as! Dictionary<String, Any>)["listing"] as! Dictionary<String, Any>;
                    callback(Listing(dictionary: listing_dictionary));
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            };
            socket.emit("get_listing", ["listing_id": listing_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getListings(listing_ids: [String], callback: @escaping (([Listing]) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            var listings = [Listing]();
            addListener(listener: {data in
                let listing_dictionary_arr = data["listings"] as! [Dictionary<String, Any>];
                for listing_dictionary in listing_dictionary_arr{
                    listings.append(Listing(dictionary: listing_dictionary))
                }
                callback(listings);
            }, forEvent: "get_listings_response", key: "DataStore", error_handler: error_handler)
            socket.emit("get_listings", ["listing_ids": listing_ids]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getListingsWithIsbn(isbn13: String, callback: @escaping (([Listing]) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            DataStore.get().addListener(listener: { response in
                print("getListingsWithIsbn successful")
                let listing_dictionary_arr = ((response as! Dictionary<String, Any>)["listings"] as! [Dictionary<String, Any>]);
                var listings = [Listing]();
                for listing_dictionary in listing_dictionary_arr{
                    listings.append(Listing(dictionary: listing_dictionary));
                }
                callback(listings);
            }, forEvent: "get_listings_with_isbn_response", key: "DataStore", error_handler: { error in
                error_handler(error);
            });
            socket.emit("get_listings_with_isbn", ["isbn13": isbn13]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getListingsWithUserId(user_id: String, callback: @escaping (([Listing]) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            DataStore.get().addListener(listener: { response in
                print("getListingsWithUserId successful")
                let listing_dictionary_arr = (response as! Dictionary<String, Any>)["listings"] as! [Dictionary<String, Any>];
                var listings = [Listing]();
                for listing_dictionary in listing_dictionary_arr{
                    listings.append(Listing(dictionary: listing_dictionary));
                }
                callback(listings);
            }, forEvent: "get_listings_with_user_id_response", key: "DataStore", error_handler: { error in
                error_handler(error);
            });
            socket.emit("get_listings_with_user_id", ["user_id": user_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getListingsMostRecent(start_index: Int, callback: @escaping (([Listing]) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            DataStore.get().addListener(listener: { response in
                print("getListingsMostRecent successful")
                let listing_dictionary_arr = (response as! Dictionary<String, Any>)["listings"] as! [Dictionary<String, Any>];
                var listings = [Listing]();
                for listing_dictionary in listing_dictionary_arr{
                    listings.append(Listing(dictionary: listing_dictionary));
                }
                callback(listings);
            }, forEvent: "get_listings_most_recent_response", key: "DataStore", error_handler: { error in
                error_handler(error);
            });
            socket.emit("get_listings_most_recent", ["start_index": start_index]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getTransaction(transaction_id: String, callback: @escaping ((Dictionary<String,Any>) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("get_transaction_response");
            socket.on("get_transaction_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("get transactions successful")
                    callback((response["data"] as! Dictionary<String, Any>)["transaction"] as! Dictionary<String, Any>);
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            };
            socket.emit("get_transaction", ["user_id": UserData.get()?.user_id! as Any, "password": UserData.get()?.password! as Any, "device_token": UserData.get()?.device_token as Any, "transaction_id": transaction_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getTransactions(callback: @escaping (([Dictionary<String,Any>]) -> Void), error_handler: @escaping ((String)->Void)){
        addListener(listener: { data in
            callback((data as! Dictionary<String, Any>)["users_active_transactions"] as! [Dictionary<String, Any>]);
        }, forEvent: "get_users_active_transactions_response", key: "DataStore", error_handler: {error  in
            error_handler(error);
        })
        if(socket_connected){
            guard let user_id = UserData.get()?.user_id else {error_handler("no user_id"); return;}
            guard let password = UserData.get()?.password else {error_handler("no password"); return;}
            guard let device_token = UserData.get()?.device_token else {error_handler("no device token"); return;}
            socket.emit("get_users_active_transactions", ["user_id": user_id, "password": password, "device_token": device_token]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getUsersActiveTransactions(user_id: String, password: String, callback: @escaping (([Dictionary<String,Any>]) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("get_users_active_transactions_response");
            socket.on("get_users_active_transactions_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("get_users_active_transactions successful")
                    callback((response["data"] as! Dictionary<String, Any>)["users_active_transactions"] as! [Dictionary<String, Any>]);
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            };
            socket.emit("get_users_active_transactions", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any]);

        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getUsersPreviousTransactions(user_id: String, password: String, callback: @escaping (([Dictionary<String,Any>]) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("get_users_previous_transactions_response");
            socket.on("get_users_previous_transactions_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("get_users_previous_transactions successful")
                    callback((response["data"] as! Dictionary<String, Any>)["users_previous_transactions"] as! [Dictionary<String, Any>]);
                }
                else{
                    error_handler(response["error"]! as! String);
                }
            };
            socket.emit("get_users_previous_transactions", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any]);
            
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getNotifications(callback: @escaping (([Notification]) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: {data in
                var notifications = [Notification]();
                let notification_dictionary_array =  data["notifications"] as! [Dictionary<String, Any>];
                for notification_dictionary in notification_dictionary_array{
                    notifications.append(Notification(dictionary: notification_dictionary))
                }
                callback(notifications);
            }, forEvent: "get_notifications_response", key: "DataStore", error_handler: error_handler)
            
            guard let user_id = UserData.get()?.user_id else { DataStore.get().error_handler(error: "No User Id"); return;}
            guard let password = UserData.get()?.password else { DataStore.get().error_handler(error: "No Password"); return;}
            guard let device_token = UserData.get()?.device_token else { DataStore.get().error_handler(error: "No Device Token"); return;}
            socket.emit("get_notifications", ["user_id": user_id, "password":password, "device_token": device_token]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func deactivateNotification(notification_id: String, callback: @escaping ((Notification) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: { data in
                let notification_dictionary = data["notification"] as! Dictionary<String, Any>
                let notification = Notification(dictionary: notification_dictionary)
                //decrements badge counter if an unviewed notification is deleted
                if let viewed = notification.viewed{
                    if viewed == false{
                        UIApplication.shared.applicationIconBadgeNumber  = UIApplication.shared.applicationIconBadgeNumber - 1;
                    }
                }
                //returns notification so client can check whether the notification has been viewed
                callback(notification);
            }, forEvent: "deactivate_notification_response", key: "DataStore", error_handler: DataStore.get().error_handler)
            
            guard let user_id = UserData.get()?.user_id else { error_handler("Invalid user_id"); return;}
            guard let password = UserData.get()?.password else { error_handler("Invalid password"); return;}
            guard let device_token = UserData.get()?.device_token else { error_handler("Invalid device_token"); return;}

            socket.emit("deactivate_notification", ["notification_id": notification_id, "user_id": user_id, "password": password, "device_token": device_token]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func setNotificationAsViewed(notification_id: String, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: { data in
                UIApplication.shared.applicationIconBadgeNumber  = UIApplication.shared.applicationIconBadgeNumber - 1;
                callback();
            }, forEvent: "set_notification_as_viewed_response", key: "DataStore", error_handler: DataStore.get().error_handler)
            
            guard let user_id = UserData.get()?.user_id else { error_handler("Invalid user_id"); return;}
            guard let password = UserData.get()?.password else { error_handler("Invalid password"); return;}
            guard let device_token = UserData.get()?.device_token else { error_handler("Invalid device_token"); return;}
            
            socket.emit("set_notification_as_viewed", ["notification_id": notification_id, "user_id": user_id, "password": password, "device_token": device_token]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getUser(user_id: String, callback: @escaping ((User) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: { data in
                let user_dictionary =  data["user"]  as! Dictionary<String, Any>
                let user = User(dictionary: user_dictionary)
                callback(user);
            }, forEvent: "get_user_response", key: "DataStore", error_handler: error_handler)
            socket.emit("get_user", ["user_id": user_id])
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getUsers(user_ids: [String], callback: @escaping (([User]) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: { data in
                let user_dictionary_arr = data["users"] as! [Dictionary<String, Any>]
                var users = [User]();
                for user_dictionary in user_dictionary_arr{
                    users.append(User(dictionary: user_dictionary));
                }
                callback(users);
            }, forEvent: "get_users_response", key: "DataStore", error_handler: error_handler)
            socket.emit("get_users", ["user_ids": user_ids])
        }
        else{
            error_handler("Not connected to server")
        }
        
    }
    
    func getProfilePicture(user_id: String, callback: @escaping ((String, Data) -> Void), error_handler: @escaping ((String)->Void)){
        print("getProfilePicture called!")
        if(socket_connected){
            socket.off("get_profile_picture_response");
            socket.on("get_profile_picture_response"){ data, ack in
                print("get_profile_picture_response received");
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"] is NSNull){
                    print("get_profile_picture call successfull!")
                    let user_id = (response["data"] as! Dictionary<String, Any>)["user_id"] as! String
                    let profile_picture = (response["data"] as! Dictionary<String, Any>)["profile_picture"] as! Data
                    self.setUserProfilePicture(user_id: user_id, profile_picture: UIImage(data: profile_picture)!)
                    if let my_user_id = UserData.get()?.user_id{
                        if my_user_id == user_id{
                            
                        }
                    }
                    callback(user_id, profile_picture);
                }
                else{
                    error_handler(response["error"]! as! String)
                }
            }
            socket.emit("get_profile_picture", ["user_id": user_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getPicture(picture_id: String, callback: @escaping ((String, Data) -> Void), error_handler: @escaping ((String)->Void)){
        print("getPicture called!")
        if(socket_connected){
            socket.off("get_picture_response");
            socket.on("get_picture_response"){ data, ack in
                print("get_picture_response received");
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"] is NSNull){
                    print("get_picture call successfull!")
                    let picture_id = (response["data"] as! Dictionary<String, Any>)["picture_id"] as! String
                    let picture = (response["data"] as! Dictionary<String, Any>)["picture"] as! Data
                    self.setUserPicture(picture_id: picture_id, picture: UIImage(data: picture)!)
                    callback(picture_id, picture);
                }
                else{
                    error_handler(response["error"]! as! String)
                }
            }
            socket.emit("get_picture", ["picture_id": picture_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func getConversation(other_user_id: String, listing_id: String, callback: @escaping ((Conversation) -> Void), error_handler: @escaping ((String)->Void)){
        if let user_id = UserData.get()?.user_id{
            addListener(listener: { data in
                let conversation_dictionary = data["conversation"] as! Dictionary<String, Any>
                let conversation = Conversation(dictionary: conversation_dictionary);
                callback(conversation);
//                var message_arr = [Message]();
//                for message_dictionary in conversation{
//                    message_arr.append(Message(dictionary: message_dictionary))
//                }
//                callback(message_arr);
            }, forEvent: "get_conversation_response", key: "DataStore", error_handler: error_handler)
            
            guard let user_id = UserData.get()?.user_id else { DataStore.get().error_handler(error: "No User Id"); return;}
            guard let password = UserData.get()?.password else { DataStore.get().error_handler(error: "No Password"); return;}
            guard let device_token = UserData.get()?.device_token else { DataStore.get().error_handler(error: "No Device Token"); return;}
            socket.emit("get_conversation", ["user_id": user_id, "other_user_id": other_user_id, "password":password, "device_token": device_token, "listing_id": listing_id]);
        }
    }
    
    func getConversations(listing_id: String, callback: @escaping (([Conversation]) -> Void), error_handler: @escaping ((String)->Void)){
        if let user_id = UserData.get()?.user_id{
            addListener(listener: { data in
                let conversation_dictionary_arr = data["conversations"] as! [Dictionary<String, Any>]
                var conversations = [Conversation]();
                for conversation_dictionary in conversation_dictionary_arr{
                    conversations.append(Conversation(dictionary: conversation_dictionary))
                }
                callback(conversations);
            }, forEvent: "get_conversations_with_listing_id_response", key: "DataStore", error_handler: error_handler)
            
            guard let user_id = UserData.get()?.user_id else { DataStore.get().error_handler(error: "No User Id"); return;}
            guard let password = UserData.get()?.password else { DataStore.get().error_handler(error: "No Password"); return;}
            guard let device_token = UserData.get()?.device_token else { DataStore.get().error_handler(error: "No Device Token"); return;}
            socket.emit("get_conversations_with_listing_id", ["user_id": user_id, "listing_id": listing_id, "password":password, "device_token": device_token]);
        }
    }
    
    func searchBooks(search_query: String, start_index: Int, callback: @escaping (([Book]) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: { data in
                let books_dictionary = (data as! Dictionary<String, Any>)["books"] as! [Dictionary<String, Any>];
                var books = [Book]();
                for book_dictionary in books_dictionary{
                    books.append(Book(dictionary: book_dictionary))
                }
                callback(books);
            }, forEvent: "search_books_response", key: "DataStore", error_handler: error_handler);
            socket.emit("search_books", ["search_query": search_query, "start_index": start_index]);
        }
        else{
            error_handler("Not connected to server")
        }

    }
    
    func searchListings(search_query: String, start_index: Int, callback: @escaping (([Listing]) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: { data in
                let listings_dictionary = (data as! Dictionary<String, Any>)["listings"] as! [Dictionary<String, Any>];
                var listings = [Listing]();
                for listing_dictionary in listings_dictionary{
                    listings.append(Listing(dictionary: listing_dictionary))
                }
                callback(listings);
            }, forEvent: "search_listings_response", key: "DataStore", error_handler: error_handler);
            socket.emit("search_listings", ["search_query": search_query, "start_index": start_index]);
        }
        else{
            error_handler("Not connected to server")
        }
        
    }
    
    func updateUserLocation(user_id: String, password: String,  new_location: [String: Double], callback: @escaping ((Dictionary<String, Any>) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.once("update_user_location_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("update_user_location successfull!");
                    callback((response["data"] as! Dictionary<String, Any>)["updated_location"] as! Dictionary<String, Double>);
                    self.currentLocation = Location(dictionary: (response["data"] as! Dictionary<String, Any>)["updated_location"] as! Dictionary<String, Double>)
                }
                else{
                    error_handler(response["error"]! as! String)
                }
            }
            socket.emit("update_user_location", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "new_location": new_location]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func updateVenmoId(venmo_id: String, callback: @escaping ((String) -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            addListener(listener: { data in
                let updated_venmo_id = data["updated_venmo_id"] as! String
                callback(updated_venmo_id);
            }, forEvent: "update_venmo_id_response", key: "DataStore", error_handler: DataStore.get().error_handler)
            
            guard let user_id = UserData.get()?.user_id else { DataStore.get().error_handler(error: "Invalid user id"); return; }
            guard let password = UserData.get()?.password else { DataStore.get().error_handler(error: "Invalid password"); return; }
            guard let device_token = UserData.get()?.device_token else { DataStore.get().error_handler(error: "Invalid device_token"); return; }
            socket.emit("update_venmo_id", ["user_id": user_id, "password": password, "device_token": device_token, "venmo_id": venmo_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func updateProfilePicture(user_id: String, password:String, profile_picture: Data, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("update_profile_picture_response");
            socket.on("update_profile_picture_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("update_profile_picture successfull!");
                    //                callback((response["data"] as! Dictionary<String, Any>)["profile_picture"] as! Data);
                    callback();
                }
                else{
                    error_handler(response["error"]! as! String)
                }
            }
            socket.emit("update_profile_picture", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "profile_picture": profile_picture]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func updatePicture(user_id: String, password:String, picture_id: String, picture: Data, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            print("updatePicture called");
            socket.off("update_picture_response");
            socket.on("update_picture_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("update_picture successfull!");
                    //                callback((response["data"] as! Dictionary<String, Any>)["profile_picture"] as! Data);
                    callback();
                }
                else{
                    error_handler(response["error"]! as! String)
                }
            }
            socket.emit("update_picture", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "picture_id": picture_id, "picture": picture]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func addPictureToListing(user_id: String, password:String, listing_id: String, picture: Data, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("add_picture_to_listing_response");
            socket.on("add_picture_to_listing_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("add_picture_to_listing successfull!");
                    callback();
                }
                else{
                    error_handler(response["error"]! as! String)
                }
            }
            socket.emit("add_picture_to_listing", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "listing_id": listing_id, "picture": picture]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func deletePictureFromListing(user_id: String, password:String, listing_id: String, picture_id: String, callback: @escaping (() -> Void), error_handler: @escaping ((String)->Void)){
        if(socket_connected){
            socket.off("delete_picture_from_listing_response");
            socket.on("delete_picture_from_response"){data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("delete_picture_from_listing successfull!");
                    callback();
                }
                else{
                    error_handler(response["error"]! as! String)
                }
            }
            socket.emit("delete_picture_from_listing", ["user_id": user_id, "password": password, "device_token": UserData.get()?.device_token as Any, "listing_id": listing_id, "picture_id": picture_id]);
        }
        else{
            error_handler("Not connected to server")
        }
    }
    
    func sendMessage(message_text: String, to_user_id: String, listing_id: String, callback: ((Message) -> Void)?, error_handler: ((String)->Void)?){
        if(socket_connected){
            guard let user_id = UserData.get()?.user_id else{
                error_handler!("No user_id")
                return;
            }
            guard let password = UserData.get()?.password else{
                error_handler!("No password");
                return;
            }
            guard let device_token = UserData.get()?.device_token else{
                error_handler!("No device_token");
                return;
            }
            addListener(listener: { data in
                let message = data["message"] as! Dictionary<String, Any>;
                if(callback != nil){
                    let message = Message(dictionary: message);
                    callback!(message);
                }
            }, forEvent: "send_message_response", key: "DataStore", error_handler: error_handler)
            
            socket.emit("send_message", ["user_id": user_id, "password": password, "device_token": device_token, "to_user_id": to_user_id, "message_text": message_text, "listing_id": listing_id]);
        }
        else{
            if(error_handler != nil){
                error_handler!("Not connected to server")
            }
        }
    }
    
    //no error handlers for events initiated by server
    //thus doesn't require error_handler, since server in theory will not issue invalid messages
    //we usually set key as the name of the Controller where the listener is created
    func addListener(listener: @escaping ((Dictionary<String, Any>) -> ()), forEvent: String, key: String, error_handler: ((String) -> ())? = nil){
        if(eventListenerDictionary[forEvent] == nil){
            eventListenerDictionary[forEvent] = [String:UUID]();
        }

        if(eventListenerDictionary[forEvent]?[key] != nil){
            socket.off(id: (eventListenerDictionary[forEvent]?[key])!)
        }
        if(error_handler == nil){
            let id = socket.on(forEvent, callback: {data, ack in
                let message = data[0] as! Dictionary<String, Any>
                listener(message["data"] as! Dictionary<String, Any>);
            })
            eventListenerDictionary[forEvent]?[key] = id;
        }
        else{
            let id = socket.on(forEvent, callback: {data, ack in
                let message = data[0] as! Dictionary<String, Any>
                if(message["error"]! is NSNull){
                    if(message["data"] is NSNull){
                        listener(Dictionary<String, Any>());
                    }
                    else{
                        listener(message["data"] as! Dictionary<String, Any>);
                    }
                }
                else{
                    error_handler!(message["error"]! as! String)
                }
                
            })
            eventListenerDictionary[forEvent]?[key] = id;
            
        }
    }
    
    func addListenerOnce(listener: @escaping ((Dictionary<String, Any>) -> ()), forEvent: String){
        socket.once(forEvent){data, ack in
            let message = data[0] as! Dictionary<String, Any>
            listener(message["data"] as! Dictionary<String, Any>);
        }
    }
    
    //used to get with an identifier string as a key
    //returns nil is not found
    func getControllerWithIdentifier(identifier: String) -> UIViewController?{
        return controllerDictionary[identifier];
    }
    
    func addControllerWithIdentifier(identifier: String, controller: UIViewController){
        controllerDictionary[identifier] = controller;
    }
    
    func getUserProfilePicture(user_id: String) -> UIImage?{
        return userDictionary[user_id]?.profile_picture;
//        return profilePictureDictionary[user_id];
    }
    
    func setUserProfilePicture(user_id: String, profile_picture: UIImage){
        if(userDictionary[user_id] == nil){
//            userDictionary[user_id] = User(user_id: user_id);
        }
//        if(userDictionary[user_id]?.profile_picture  == nil){
//            userDictionary[user_id] = User(user_id: user_id);
//        }
        userDictionary[user_id]?.profile_picture = profile_picture;
//        profilePictureDictionary[user_id] = profile_picture;
    }
    
    func setUserInfo(user_info: Dictionary<String, Any>){
        let user_id = user_info["_id"] as! String
        if(userDictionary[user_id] != nil){
            userDictionary[user_id]?.update(user_info: user_info);
        }
        else{
            userDictionary[user_id] =  User(dictionary: user_info)
        }
    }
    
    func setUserPicture(picture_id: String, picture: UIImage){
        pictureDictionary[picture_id] = picture;
    }
    
    func getUserInfo(user_id: String) -> User?{
        return userDictionary[user_id];
    }
    
    func getUserPicture(picture_id: String) -> UIImage?{
        return pictureDictionary[picture_id];
    }
    
    func error_handler(error: String){
        if(error == "tried to authenticate an invalid user_id/password combination"){
//            showLoginScreen();
        }
        else if(error == "Not connected to server"){
//            socket.reconnect();
        }
        else if(error == "No conversations were found"){
            //do nothing
        }
        else{
        
            let alertController = UIAlertController(title: "Error", message: error, preferredStyle: UIAlertControllerStyle.alert)
            let okAction = UIAlertAction(title: "Ok", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
            }
            alertController.addAction(okAction)
            UIApplication.topViewController()?.present(alertController, animated: true, completion: nil)
        }
    }
    
    func randomString(length: Int) -> String {
        
        let letters : NSString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let len = UInt32(letters.length)
        
        var randomString = ""
        
        for _ in 0 ..< length {
            let rand = arc4random_uniform(len)
            var nextChar = letters.character(at: Int(rand))
            randomString += NSString(characters: &nextChar, length: 1) as String
        }
        
        return randomString
    }
}



extension UIApplication {
    class func topViewController(base: UIViewController? = (UIApplication.shared.delegate as! AppDelegate).window?.rootViewController) -> UIViewController? {
        if let nav = base as? UINavigationController {
            return topViewController(base: nav.visibleViewController)
        }
        if let tab = base as? UITabBarController {
            if let selected = tab.selectedViewController {
                return topViewController(base: selected)
            }
        }
        if let presented = base?.presentedViewController {
            return topViewController(base: presented)
        }
        return base
    }
    
    
    func getDataFromUrl(url: URL, completion: @escaping (_ data: Data?, _  response: URLResponse?, _ error: Error?) -> Void) {
        URLSession.shared.dataTask(with: url) {
            (data, response, error) in
            completion(data, response, error)
            }.resume()
    }
    
    func downloadImage(url: URL, done: @escaping ((UIImage?) -> Void)) {
        print("Download Started")
        getDataFromUrl(url: url) { (data, response, error)  in
            guard let data = data, error == nil else { return }
            print(response?.suggestedFilename ?? url.lastPathComponent)
            print("Download Finished")
            DispatchQueue.main.async() { () -> Void in
                done(UIImage(data: data))
            }
        }
    }
}



protocol LocationSubscriber{
    func onUserLocationUpdated();
}
