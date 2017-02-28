//
//  NotificationCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/10/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class NotificationCell:UITableViewCell{
    
    
    @IBOutlet weak var profilePictureView: TapImageView!
    
    @IBOutlet weak var timeSentLabel: UILabel!
    @IBOutlet weak var messageLabel: MultilineLabelThatWorks!
    
    var user: User?
    
    override func awakeFromNib() {
    }
    
    func set(notification: Notification, user: User){
        self.user = user;
        if let profile_picture = user.profile_picture{
            self.profilePictureView.image = profile_picture
        }
        else{
            self.profilePictureView.image = #imageLiteral(resourceName: "profile_pic")
        }
        self.messageLabel.text = notification.message;
        self.timeSentLabel.text = notification.time_sent!.timePassed();
        if let viewed = notification.viewed{
            if viewed == true{
                self.backgroundColor = UIColor.clear;
            }
            else{
                self.backgroundColor = UIColor.groupTableViewBackground
            }
        }
    }
}
