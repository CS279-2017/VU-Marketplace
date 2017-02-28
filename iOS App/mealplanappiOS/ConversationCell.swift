//
//  ChatCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/17/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class ConversationCell: UITableViewCell{
    
    var listing: Listing?
    var message: Message?;
    var user: User?;

    @IBOutlet weak var profilePictureView: UIImageView!
    
    @IBOutlet weak var nameLabel: UILabel!
    @IBOutlet weak var lastMessageLabel: UILabel!
    @IBOutlet weak var timeSentLabel: UILabel!
    
    @IBOutlet weak var buyerButton: UIButton!
    
//    override func awakeFromNib() {
//        
//        
//
//    }
    
    func set(conversation: Conversation, listing: Listing, user: User){
        self.listing = listing;
        let messages = conversation.messages;
        self.message = messages[messages.count - 1];
        self.user = user;
        
        buyerButton.alpha = 0;
        guard let user = self.user else{ return; }
        guard let listing = self.listing else{return;}
        if let buyer_id = listing.bought_by_user_id{
            if(user._id == buyer_id){
                buyerButton.alpha = 1;
            }
        }
        nameLabel.text = user.first_name! + " " + user.last_name!
        
        timeSentLabel.text = (message?.time_sent)?.timePassed();
        
        lastMessageLabel.text = message?.text;
        
        if let profile_picture = user.profile_picture{
            profilePictureView.image = profile_picture;
        }else{
            profilePictureView.image = #imageLiteral(resourceName: "profile_pic");
        }
        if let bought_by_user_id = listing.bought_by_user_id{
            if(user._id == bought_by_user_id){
                buyerButton.alpha = 1;
            }
        }
    }
}

