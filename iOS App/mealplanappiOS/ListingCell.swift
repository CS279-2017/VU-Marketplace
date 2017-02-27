//
//  ListingCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/15/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit
import MapKit


class ListingCell: UITableViewCell{
    var listing:Listing?
    
    @IBOutlet weak var profilePictureView: UIImageView!
   
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var timeLeftLabel: UILabel!
    @IBOutlet weak var distanceLabel: UILabel!
    @IBOutlet weak var listingOwnerDistanceLabel: UILabel!
    @IBOutlet weak var descriptionLabel: UILabel!
    
    var buy_or_sell: String = "";
    var titleText: String = "";
    
    override func awakeFromNib() {
        profilePictureView.image = nil;
        titleLabel.text = nil;
        descriptionLabel.text = nil;
        listingOwnerDistanceLabel.text = nil;
        descriptionLabel.text = nil;
        timeLeftLabel.text = nil;

    }
    
    func setListing(listing: Listing){
        self.listing = listing;
        
        let user_info = DataStore.get().getUserInfo(user_id: listing.user_id);
        var users_name = "User's Name"
        
        if(user_info != nil && user_info!.first_name != nil && user_info!.last_name != nil){
            users_name = (user_info?.first_name)! + " " + (user_info?.last_name)!;
        }
        
        if let profile_picture = DataStore.get().getUserProfilePicture(user_id: listing.user_id){
            profilePictureView.image = profile_picture;
        }
        else{
            profilePictureView.image = #imageLiteral(resourceName: "profile_pic")
        }
        
//        profilePictureView.image = #imageLiteral(resourceName: "profile_pic");
        
        self.titleLabel.text = "Loading..."
        self.timeLeftLabel.text = "";
        self.distanceLabel.text = "";
        self.descriptionLabel.text = "";

//         _ = Timer.scheduledTimer(timeInterval: 1.0, target: self, selector: #selector(updateExpireTime), userInfo: nil, repeats: true);
        
        if(DataStore.get().currentLocation != nil){
            if let my_location = UserData.get()?.location{
                distanceLabel.text = "Your Distance From Meet Up Location: " + String(calculateDistance(location1: listing.location!, location2: my_location)) + " m"
            }
            else{
                distanceLabel.text = "Distance From You: N/A" 
            }
            
        }
        
        if let listingOwner = DataStore.get().getUserInfo(user_id: listing.user_id){
            if listingOwner._id != UserData.get()?.user_id{
                if let listing_owners_location = listingOwner.location{
                    listingOwnerDistanceLabel.isHidden = false;
                    let listing_owner_name = listingOwner.first_name! + " " + listingOwner.last_name!
                    listingOwnerDistanceLabel.text = listing_owner_name + "'s Distance From Meet Up Location: " + String(calculateDistance(location1: listing.location!, location2: listing_owners_location)) + " m"
                }
                else{
                    listingOwnerDistanceLabel.isHidden = true;
                }
            }
            else{
                listingOwnerDistanceLabel.isHidden = true;
            }
        }
        else{
            listingOwnerDistanceLabel.isHidden = true;
        }
        
//        timeLeftLabel.text = "Time Left: " + listing.expiration_time.timeLeft()
        descriptionLabel.text = listing.description;
        
        if(listing.user_id == UserData.get()?.user_id){
            users_name = "You"
            if(listing.buy == true){
                buy_or_sell = " want to buy "
            }
            else{
                buy_or_sell = " want to sell "
            }
        }
        else{
            if(listing.buy == true){
                buy_or_sell = " wants to buy "
            }
            else{
                buy_or_sell = " wants to sell "
            }
        }
       
        let formattedString = NSMutableAttributedString()
        self.titleLabel.attributedText = formattedString.bold(text: (users_name)).normal(text: buy_or_sell).bold(text: "'" + listing.title! + "'").normal(text: " for ").bold(text: listing.price.toTwoDecimalPlaces())
//        }
    }
    
    private func calculateDistance(location1: Location, location2: Location) -> Int{
        let distance  = Int(location1.location().distance(from: location2.location()));
        return distance;
    }
    
//    func updateExpireTime(){
//        timeLeftLabel.text = "Time Left: " + (listing?.expiration_time.timeLeft())!
//    }
}



//outputs a time left string from a u64int

