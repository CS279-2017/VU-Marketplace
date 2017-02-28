//
//  BaseController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 2/7/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class BaseController: UIViewController{
    
    var isSeguing = false;
    
    override func viewDidLoad() {
        super.viewDidLoad();
        self.hideKeyboardWhenTappedAround()
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        hideProgressBar();
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated);
        
        DataStore.get().socket.off("connect")
        DataStore.get().socket.on("connect") {data, ack in
            print("socket connected")
            self.hideProgressBar();
            self.viewWillAppear(animated);
            self.viewDidAppear(animated);
        }
        DataStore.get().socket.off("reconnectAttempt")
        DataStore.get().socket.on("reconnectAttempt"){data, ack in
            self.showProgressBar();
        }
        
        if(!DataStore.get().socket_connected){
            showProgressBar();
        }
        else{
            hideProgressBar();
            DataStore.get().authenticate(callback: {
                print("authentication successful!");
            }, error_handler: {error in
                if(error != "Not connected to server"){
                    self.showLoginScreen(completion: {
//                        DataStore.get().error_handler(error: error);
                    });
                }
                else{
                    DataStore.get().error_handler(error: error);
                }
            })
        }
        
    }
    
    func showProgressBar(){
        self.showProgressBar(msg: "Connecting", true, width: 175);
    }

    
    func showLoginScreen(completion: (()->())?){
        if(self.isNonLoginController()){
            let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
            let controller : UIViewController = storyBoard.instantiateViewController(withIdentifier: "LoginController") as! LoginController
            self.present(controller, animated: true, completion: completion);
        }
    }
    
    func segueToListingDetailController(selectedListing: Listing){
        if(!isSeguing){
            isSeguing = true;
            if(DataStore.get().socket_connected){
                self.showActivityIndicator()
                let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
                let controller : ListingDetailController = storyBoard.instantiateViewController(withIdentifier: "ListingDetailController") as! ListingDetailController
                DataStore.get().getUser(user_id: selectedListing.user_id, callback: { user in
                    controller.set(listing: selectedListing, user: user);
                    self.hideActivityIndicator();
                    self.present(controller, animated: true, completion: nil);
                    self.isSeguing = false;
                }, error_handler: { error in
                    self.hideActivityIndicator();
                    DataStore.get().error_handler(error: error)
                    self.isSeguing = false;
                })
            }
            else{
                DataStore.get().error_handler(error: "Not connected to server");
                isSeguing = false;
            }
        }
    }
    
    func segueToChatViewController(selectedListing: Listing, selectedUserId: String){
        if(!isSeguing){
            isSeguing = true;
            if(DataStore.get().socket_connected){
                self.showActivityIndicator();
                DataStore.get().getUser(user_id: selectedUserId, callback: {user in
                    let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
                    let controller : ChatViewController = storyBoard.instantiateViewController(withIdentifier: "ChatViewController") as! ChatViewController
                    controller.set(listing: selectedListing, user: user);
                    self.hideActivityIndicator();
                    self.present(controller, animated: true, completion: nil);
                    self.isSeguing = false;
                }, error_handler: { error in
                    self.hideActivityIndicator();
                    DataStore.get().error_handler(error: error);
                    self.isSeguing = false;
                });
                
            }
            else{
                DataStore.get().error_handler(error: "Not connected to server");
                isSeguing = false;
            }
        }
       
    }
    
    func segueToProfileViewController(selectedUser: User){
        if(!isSeguing){
            isSeguing = true;
            let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
            let controller : ProfileViewController = storyBoard.instantiateViewController(withIdentifier: "ProfileViewController") as! ProfileViewController
            controller.set(user: selectedUser);
            self.present(controller, animated: true, completion: nil);
            isSeguing = false;
        }
       
        //        DataStore.get().getUser(user_id: selectedListing.user_id, callback: { user in
        //            controller.set(listing: selectedListing, user: user);
        //            self.present(controller, animated: true, completion: nil);
        //        }, error_handler: DataStore.get().error_handler)
    }

}


