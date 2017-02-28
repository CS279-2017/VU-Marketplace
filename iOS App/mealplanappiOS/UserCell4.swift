//
//  UserCell4.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/24/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class UserCell4: UITableViewCell{
    var user: User?
    
    @IBOutlet weak var venmoIdLabel: UILabel!
    @IBOutlet weak var nameLabel: UILabel!
    @IBOutlet weak var profilePictureView: UIImageView!
    func set(user: User){
        self.user = user;
        if let profile_picture = user.profile_picture{
            profilePictureView.image = profile_picture
        }
        else{
            profilePictureView.image = #imageLiteral(resourceName: "profile_pic")
        }
        guard let first_name = user.first_name else { nameLabel.text = ""; return;}
        guard let last_name = user.last_name else { nameLabel.text = ""; return; }
        nameLabel.text = first_name + " " + last_name
        
        if let venmo_id = user.venmo_id{
            venmoIdLabel.text = "@" + venmo_id
        }
    }
}
