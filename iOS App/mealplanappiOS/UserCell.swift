//
//  UserInfoCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/8/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class UserCell: UITableViewCell{
    
    var transaction:Transaction?
    
    
    @IBOutlet weak var profilePictureView: UIImageView!
    @IBOutlet weak var nameLabel: UILabel!
    @IBOutlet weak var venmoIdLabel: CopyableLabel!
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var buyOrSellLabel: UILabel!
    @IBOutlet weak var priceLabel: UILabel!
    @IBOutlet weak var otherUserDistanceLabel: UILabel!
    @IBOutlet weak var yourDistanceLabel: UILabel!


    

    override func awakeFromNib() {
        profilePictureView.image = nil;
        nameLabel.text = nil;
        venmoIdLabel.text = nil;
        titleLabel.text = nil;
        buyOrSellLabel.text = nil;
        priceLabel.text = nil;
        yourDistanceLabel.text = nil;
        otherUserDistanceLabel.text = nil;
    }
    
    func setTransaction(transaction: Transaction){
        self.transaction = transaction;
        let user = DataStore.get().getUserInfo(user_id: transaction.getOtherUserId()!)
        profilePictureView.image = #imageLiteral(resourceName: "profile_pic")
        if(user != nil){
            if let profile_picture = DataStore.get().getUserProfilePicture(user_id: (user?._id!)!){
                profilePictureView.image = profile_picture;
            }
            else{
                profilePictureView.image = #imageLiteral(resourceName: "profile_pic")
            }
            nameLabel.text =  (user!.first_name!) + " " + (user?.last_name!)!;
            venmoIdLabel.text = "Venmo Id: " + ((user?.venmo_id != nil) ? (user?.venmo_id)! : "None")
            titleLabel.text = transaction.title;
            buyOrSellLabel.text = (user?._id == transaction.buyer_user_id) ? "You are Buying" : "You are Selling"
            priceLabel.text = "for " + ((transaction.offer != nil) ? transaction.offer! : transaction.price!).toTwoDecimalPlaces();
            
            
            updateDistanceLabels();
            func userLocationUpdatedListener(dictionary: Any){
                updateDistanceLabels();
//                let dictionary = dictionary as! Dictionary<String, Any>
//                let user_id = dictionary["user_id"] as! String
//                //                let transaction_id = dictionary["transaction_id"] as! String;
//                let updated_location = Location(dictionary: dictionary["updated_location"] as! Dictionary<String, Any>)
//                
//                if(user_id == UserData.get()?.user_id!){
//                    yourDistanceLabel.text = String(calculateDistance(location1: (self.transaction?.location)!, location2: updated_location))
//                }
//                
//                if(user_id == transaction.getOtherUserId()){
//                    otherUserDistanceLabel.text = String(calculateDistance(location1: (self.transaction?.location)!, location2: updated_location));
//                }
            }
            
            DataStore.get().addListener(listener: userLocationUpdatedListener, forEvent: "user_location_updated", key: "UserCell");
            
        }
    }
    
    func updateDistanceLabels(){
        if let yourLocation = UserData.get()?.location{
            self.yourDistanceLabel.text = String(calculateDistance(location1: (self.transaction?.location)!, location2: yourLocation)) + "m Away"
        }
        if let otherUser = DataStore.get().getUserInfo(user_id: (transaction?.getOtherUserId()!)!){
            if let otherUserLocation = otherUser.location{
                self.otherUserDistanceLabel.text = String(calculateDistance(location1: (self.transaction?.location)!, location2: otherUserLocation)) + "m Away"
            }
        }
    }
    
    private func calculateDistance(location1: Location, location2: Location) -> Int{
        let distance  = Int(location1.location().distance(from: location2.location()));
        return distance;
    }
}
