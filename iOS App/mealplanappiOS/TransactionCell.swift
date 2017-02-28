//
//  TransactionCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/19/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class TransactionCell: UITableViewCell{
    
    var transaction:Transaction?
    
    @IBOutlet weak var otherUserNameLabel: UILabel!
    @IBOutlet weak var buyOrSellLabel: UILabel!
    @IBOutlet weak var transactionTitleLabel: UILabel!
    
    override init(style: UITableViewCellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier);
    }
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        //        fatalError("init(coder:) has not been implemented")
    }
    
    func setTransaction(transaction:Transaction){
        self.transaction = transaction;
        var other_user_id = transaction.getOtherUserId();
        if(transaction.isUserTheBuyer())!{
            buyOrSellLabel.text = "You are Buying from"
        }
        else{
            buyOrSellLabel.text = "You are Selling to "
        }
        transactionTitleLabel.text = transaction.title;
        func callback(user_info: Dictionary<String, Any>){
            let first_name = user_info["first_name"] as! String;
            let last_name = user_info["last_name"] as! String;
            otherUserNameLabel.text = first_name + " " + last_name;
        }
        func error_handler(error: String){
            print(error);
        }
        DataStore.get().getUser(user_id: other_user_id!, callback: callback, error_handler: error_handler)
    }
}
