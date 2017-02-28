//
//  ListingCell2.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/11/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class ListingCell2: UITableViewCell{
    @IBOutlet weak var profilePictureView: TapImageView!
    
    @IBOutlet weak var descriptionLabel: UILabel!
    @IBOutlet weak var priceLabel: UILabel!
    @IBOutlet weak var nameLabel: UILabel!
    @IBOutlet weak var soldLabel: UILabel!
    
    override func awakeFromNib() {
            }
    
    func setListing(listing: Listing){
        if let first_name = listing.first_name{
            if let last_name = listing.last_name{
                nameLabel.text = first_name + " " + last_name
            }
        }
        priceLabel.text = listing.price.toTwoDecimalPlaces();
        if let description = listing.description{
            descriptionLabel.text = description
            descriptionLabel.isHidden = false;
        }
        else{
            descriptionLabel.isHidden = true;
        }
        profilePictureView.image = DataStore.get().getUserProfilePicture(user_id: listing.user_id)
        if(profilePictureView.image == nil){
            profilePictureView.image = #imageLiteral(resourceName: "profile_pic")
        }
        
        if(listing.sold == false){
            soldLabel.isHidden = true;
        }
        else{
            soldLabel.isHidden = false;
        }

    }
}
