//
//  MessageCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/19/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class MessageCell: UITableViewCell{
    
    var message: Message?;
    var user: User?
    
    @IBOutlet weak var sentTimeLabel: UILabel!
    @IBOutlet weak var profilePictureView: UIImageView!
    @IBOutlet weak var messageTextLabel: MultilineLabelThatWorks!
    override init(style: UITableViewCellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier);
    }
    
    override func awakeFromNib() {
        profilePictureView.image = nil;
        messageTextLabel.text = nil;
    }
    
    @IBOutlet weak var messageStackView: UIStackView!
    @IBOutlet weak var messageView: UIView!
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    func set(message: Message, profile_picture: UIImage?){
        self.message = message;
        self.selectionStyle = .none;
        messageTextLabel.text = message.text
        sentTimeLabel.text = message.time_sent.toDateString();
        if let profile_picture = profile_picture{
            profilePictureView.image = profile_picture;
        }
        else{
            profilePictureView.image = #imageLiteral(resourceName: "profile_pic")
        }
    }
}
