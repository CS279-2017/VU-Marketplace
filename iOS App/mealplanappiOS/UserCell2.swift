//
//  UserCell2.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/11/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class UserCell2: UITableViewCell{
    
    @IBOutlet weak var nameLabel: UILabel!
    @IBOutlet weak var profilePictureView: TapImageView!
    @IBOutlet weak var venmoIdLabel: CopyableLabel!
    @IBOutlet weak var acceptButton: UIButton!
    
    func setTransaction(transaction: Transaction){
        guard let user_id = UserData.get()?.user_id else { return; }
        if user_id == transaction.buyer_user_id{
            guard let first_name = transaction.seller_first_name else { return; }
            guard let last_name = transaction.seller_last_name else { return; }
            guard let venmo_id = transaction.seller_venmo_id else {return; }
            nameLabel.text = first_name + " " + last_name;
            venmoIdLabel.text = venmo_id

        }
        else if user_id == transaction.seller_user_id{
            guard let first_name = transaction.buyer_first_name else { return; }
            guard let last_name = transaction.buyer_last_name else { return; }
            guard let venmo_id = transaction.buyer_venmo_id else {return; }
            nameLabel.text = first_name + " " + last_name;
            venmoIdLabel.text = "Venmo Id: " + venmo_id
        }
        profilePictureView.image = DataStore.get().getUserProfilePicture(user_id: transaction.getOtherUserId()!);
        if(transaction.seller_user_id == user_id && (transaction.seller_accepted_request is NSNull)){
            acceptButton.isHidden = false;
        }
        else{
            acceptButton.isHidden = true;
        }
    }
}
