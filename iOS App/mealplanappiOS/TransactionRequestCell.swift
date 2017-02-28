//
//  TransactionRequestCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/19/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class TransactionRequestCell: UITableViewCell{
    
    var transaction:Transaction?

    @IBOutlet weak var waitingForResponseLabel: UILabel!
    
    @IBOutlet weak var requestMessageLabel: UILabel!
    @IBOutlet weak var acceptTransactionButton: UIButton!
    
    @IBOutlet weak var declineTransactionButton: UIButton!
    
    override func awakeFromNib() {
        waitingForResponseLabel.text = nil;
        requestMessageLabel.text = nil;
    }
    
    func setTransaction(transaction:Transaction){
        self.transaction = transaction;
        
        var other_user_id = transaction.getOtherUserId();
        func callback(user_info: Dictionary<String, Any>){
            let first_name = user_info["first_name"] as! String;
            let last_name = user_info["last_name"] as! String;
            var wantsToBuyOrSell = "";
            if(transaction.isUserTheBuyer())!{
                wantsToBuyOrSell = " wants to buy "
            }
            else{
                wantsToBuyOrSell = " wants to sell "
            }
            let transactionTitle = transaction.title;
            requestMessageLabel.text = first_name + " " + last_name + wantsToBuyOrSell + transactionTitle
            waitingForResponseLabel.text = "Waiting for response of " + first_name + " " + last_name;
        }
        func error_handler(error: String){
            print(error);
        }
        DataStore.get().getUser(user_id: other_user_id!, callback: callback, error_handler: error_handler)
        
        let user_id = UserData.get()?.user_id
        if(user_id != nil && self.transaction != nil){
            if(user_id! == self.transaction?.buyer_user_id){
                print("user is buyer!")
                if(self.transaction?.buyer_accepted_request is NSNull){
                    waitingForResponseLabel.isHidden = true;
                    acceptTransactionButton.isHidden = false;
                    declineTransactionButton.isHidden = false;
                    print("buy_accepted_request is null")
                }
                else{
                    if(self.transaction?.buyer_accepted_request as! Bool == true){
                        requestMessageLabel.isHidden = true;
                        waitingForResponseLabel.isHidden = false;
                        acceptTransactionButton.isHidden = true;
                        declineTransactionButton.isHidden = true;
                        print()
                    }
                    else{
                        waitingForResponseLabel.isHidden = true;
                        acceptTransactionButton.isHidden = false;
                        declineTransactionButton.isHidden = false;
                    }
                }
            }
            else if(user_id == self.transaction?.seller_user_id){
                print("user is seller");
                if(self.transaction?.seller_accepted_request is NSNull){
                    waitingForResponseLabel.isHidden = true;
                    acceptTransactionButton.isHidden = false;
                    declineTransactionButton.isHidden = false;
                }
                else if(self.transaction?.seller_accepted_request as! Bool == true){
                    requestMessageLabel.isHidden = true;
                    waitingForResponseLabel.isHidden = false;
                    acceptTransactionButton.isHidden = true;
                    declineTransactionButton.isHidden = true;
                }
                else{
                    waitingForResponseLabel.isHidden = true;
                    acceptTransactionButton.isHidden = false;
                    declineTransactionButton.isHidden = false;
                }
            }
            else{
                print("TransactionRequestCell: ERORR! current user_id doesn't match buyer_user_id or seller_user_id of transaction");
            }
        }
        else{
            if(user_id == nil){
                print("TransactionRequestCell: error, user isn't logged in")
            }
            if(self.transaction == nil){
                print("TransactionRequestCell: error, transaction is nil")
            }
        }
        
        acceptTransactionButton.addTarget(self, action: #selector(acceptTransactionButtonClicked(button:)), for: .touchUpInside)
        declineTransactionButton.addTarget(self, action: #selector(declineTransactionButtonClicked(button:)), for: .touchUpInside)
        
        self.bringSubview(toFront:acceptTransactionButton)
        self.bringSubview(toFront: declineTransactionButton);
        
    }
    
    func acceptTransactionButtonClicked(button: UIButton){
        print("Accept transaction button clicked!")
        func callback(){
            print("acceptTransaction completed successfully");
        }
        
        func error_handler(error:String){
            print(error);
        }
        DataStore.get().acceptTransactionRequest(user_id: (UserData.get()?.user_id)!, password: (UserData.get()?.password)!, transaction_id: (self.transaction?._id)!, callback: callback, error_handler: error_handler)
    }
    
    func declineTransactionButtonClicked(button: UIButton){
        print("Decline transaction button clicked!")
        func callback(){
            print("acceptTransaction completed successfully");
        }
        
        func error_handler(error:String){
            print(error);
        }
        DataStore.get().declineTransactionRequest(user_id: (UserData.get()?.user_id)!, password: (UserData.get()?.password)!, transaction_id: (self.transaction?._id)!, callback: callback, error_handler: error_handler)
    }
    
    
    
}
