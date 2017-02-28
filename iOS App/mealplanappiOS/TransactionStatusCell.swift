//
//  TransactionStatusCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/3/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class TransactionStatusCell: UITableViewCell{
    @IBOutlet weak var buyerStatusLabel: UILabel!
    @IBOutlet weak var sellerStatusLabel: UILabel!
    
    var transaction: Transaction?
    
    override func awakeFromNib() {
        buyerStatusLabel.text = nil;
        sellerStatusLabel.text = nil;
    }
    
    func setTransaction(transaction: Transaction?){
        if transaction != nil{
            
            if let buyer_user = DataStore.get().getUserInfo(user_id: (transaction?.buyer_user_id)!){
                let formattedString = NSMutableAttributedString()
                var user_full_name = buyer_user.first_name! + " " + buyer_user.last_name!;
                if buyer_user._id == UserData.get()?.user_id{
                    user_full_name = "You"
                }
                var transaction_status: String?
                if transaction?.buyer_confirmed_meet_up is NSNull{
                    if (user_full_name == "You"){
                        transaction_status = " haven't confirmed"
                    }
                    else{
                        transaction_status = " hasn't confirmed"
                    }
                }
                else if(transaction?.buyer_confirmed_meet_up as! Bool == true){
                    if (user_full_name == "You"){
                        transaction_status = " have confirmed"
                    }
                    else{
                        transaction_status = " has confirmed"
                    }
                }
                else if transaction?.buyer_confirmed_meet_up as! Bool == true {
                    if (user_full_name == "You"){
                        transaction_status = " have terminated"
                    }
                    else{
                        transaction_status = " has terminated"
                    }
                }
                self.buyerStatusLabel.attributedText = formattedString.normal(text: user_full_name + transaction_status!)
            }
            if let seller_user = DataStore.get().getUserInfo(user_id: (transaction?.seller_user_id)!){
                let formattedString = NSMutableAttributedString()
                var user_full_name = seller_user.first_name! + " " + seller_user.last_name!;
                if seller_user._id == UserData.get()?.user_id{
                    user_full_name = "You"
                }
                var transaction_status: String?
                if transaction?.seller_confirmed_meet_up is NSNull{
                    if (user_full_name == "You"){
                        transaction_status = " haven't confirmed"
                    }
                    else{
                        transaction_status = " hasn't confirmed"
                    }
                }
                else if(transaction?.seller_confirmed_meet_up as! Bool == true){
                    if (user_full_name == "You"){
                        transaction_status = " have confirmed"
                    }
                    else{
                        transaction_status = " has confirmed"
                    }
                }
                else if transaction?.seller_confirmed_meet_up as! Bool == true {
                    if (user_full_name == "You"){
                        transaction_status = " have terminated"
                    }
                    else{
                        transaction_status = " has terminated"
                    }
                }
                self.sellerStatusLabel.attributedText = formattedString.normal(text: user_full_name + transaction_status!)
            }
            
        }
    }
    
}
