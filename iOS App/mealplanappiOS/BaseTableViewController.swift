//
//  BaseTableViewController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 2/7/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class BaseTableViewController: UITableViewController{
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
}
