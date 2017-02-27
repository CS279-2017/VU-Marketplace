//
//  TransactionRequestSentCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/1/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class TransactionRequestSentCell: UITableViewCell{
    
    var transaction: Transaction?
    
    @IBOutlet weak var titleLabel: UILabel!
//    @IBOutlet weak var timeLabel: UILabel!
    @IBOutlet weak var withdrawRequestButton: UIButton!
    
    override func awakeFromNib() {
        titleLabel.text = nil;
//        timeLabel.text = nil;
        withdrawRequestButton.layer.borderWidth = 1;
        withdrawRequestButton.layer.borderColor = withdrawRequestButton.tintColor.cgColor;
        withdrawRequestButton.addTarget(self, action: #selector(withdrawRequestButtonClicked(button:)), for: .touchUpInside)
    }
    
    func setTransaction(transaction: Transaction){
        self.transaction = transaction;
//        titleLabel.text = Your offer of price to First Name Last Name to Buy/Sell 'Title' is Pending...
        
        _ = Timer.scheduledTimer(timeInterval: 1.0, target: self, selector: #selector(updateExpireTime), userInfo: nil, repeats: true);
        
        if let other_user_id = transaction.getOtherUserId(){
            if let user = DataStore.get().getUserInfo(user_id: other_user_id){
                let buy_or_sell = ((transaction.buy == true) ? "buy" : "sell");
                let from_or_to = ((transaction.buy == true) ? "from" : "to");
                
                let formattedString = NSMutableAttributedString()
                
                let price = (transaction.offer != nil) ? transaction.offer! : transaction.price;
                self.titleLabel.attributedText = formattedString.normal(text: "You are offering to ").normal(text: buy_or_sell + " ").bold(text: "'" + transaction.title! + "'").normal(text: " " + from_or_to + " ").bold(text: user.first_name! + " " + user.last_name!).normal(text: " for ").bold(text: (price?.toTwoDecimalPlaces())!).normal(text: " (Listing Price: " + (transaction.price?.toTwoDecimalPlaces())! + ")");
//                self.timeLabel.text = ((transaction.expiration_time != nil) ? transaction.expiration_time! :(transaction.creation_time + 60000*DataStore.get().transactionRequestResponseTime)).timeLeft();
            }
            else{
                
            }
            
        }
//        func callbackGetUser(user_info: Dictionary<String, Any>){
//            let user = User(user_info: user_info);
        

            
//        }
//        func error_handler(error: String){
//            print(error);
//        }
//        DataStore.get().getUser(user_id: other_user_id!, callback: callbackGetUser, error_handler: error_handler)
        
    }
    
    func updateExpireTime(){
//        self.timeLabel.text = ((self.transaction?.expiration_time != nil) ? (self.transaction?.expiration_time!)! :((transaction?.creation_time)! + 60000*DataStore.get().transactionRequestResponseTime)).timeLeft();
    }
    
    func withdrawRequestButtonClicked(button: UIButton){
        DataStore.get().withdrawTransactionRequest(user_id: (UserData.get()?.user_id)!, password: (UserData.get()?.password)! , transaction_id: (self.transaction?._id)!, callback: {}, error_handler: DataStore.get().error_handler)
    }
    
}
