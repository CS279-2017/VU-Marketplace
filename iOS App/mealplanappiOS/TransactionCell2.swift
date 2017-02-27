//
//  TransactionCell2.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/1/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class TransactionCell2:UITableViewCell{
    
    @IBOutlet weak var buyerProfilePicture: UIImageView!
    @IBOutlet weak var buyerToSellerLabel: UILabel!
    @IBOutlet weak var sellerToBuyerLabel: UILabel!
    @IBOutlet weak var sellerToBuyerArrow: UIImageView!
    @IBOutlet weak var buyerToSellerArrow: UIImageView!
    @IBOutlet weak var sellerProfilePicture: UIImageView!
    
    @IBOutlet weak var buyerNameLabel: UILabel!
    
    @IBOutlet weak var sellerNameLabel: UILabel!
    
    var transaction: Transaction?
    
    var buyer_user: User?
    
    var seller_user: User?
    
    var buyerPicture: UIImage?
    var sellerPicture: UIImage?
    
    
    override func awakeFromNib() {
        //flip the seller to buyer arrow

        if(buyerPicture != nil){
            buyerProfilePicture.image = buyerPicture!;
        }
        if(sellerPicture != nil){
            sellerProfilePicture.image = sellerPicture!;
        }
        
        sellerProfilePicture.image = nil;
        buyerProfilePicture.image = nil;
        
        buyerNameLabel.text = nil;
        sellerNameLabel.text = nil;
    }
    
    func setTransaction(transaction: Transaction){
        self.transaction = transaction;
        buyer_user = DataStore.get().getUserInfo(user_id: transaction.buyer_user_id)
        seller_user = DataStore.get().getUserInfo(user_id: transaction.seller_user_id)
        
        
        if let profile_picture = DataStore.get().getUserProfilePicture(user_id: transaction.buyer_user_id){
            buyerProfilePicture.image = profile_picture;
        }
        else{
            buyerProfilePicture.image = #imageLiteral(resourceName: "profile_pic")
        }
        
        if let profile_picture = DataStore.get().getUserProfilePicture(user_id: transaction.seller_user_id){
            sellerProfilePicture.image = profile_picture;
        }
        else{
            sellerProfilePicture.image = #imageLiteral(resourceName: "profile_pic")
        }
        
        buyerToSellerLabel.text = transaction.title;
        sellerToBuyerLabel.text = ((transaction.offer != nil) ? transaction.offer! : transaction.price!)
            .toTwoDecimalPlaces()
        
        
        
        if let buyer_user = buyer_user{
            if buyer_user._id == UserData.get()?.user_id{
                self.buyerNameLabel.text = "You"
            }
            else{
                if let first_name = buyer_user.first_name{
                    if let last_name = buyer_user.last_name{
                        buyerNameLabel.text = first_name + " " + last_name
                        
                    }
                }
            }
        }
       
        
        if let seller_user = seller_user{
            if seller_user._id == UserData.get()?.user_id{
                self.sellerNameLabel.text = "You"
            }
            else{
                if let first_name = seller_user.first_name{
                    if let last_name = seller_user.last_name{
                        sellerNameLabel.text = first_name + " " + last_name
                    }
                }
            }
        }
        
        
        sellerToBuyerArrow.transform = CGAffineTransform(scaleX: -1, y: 1)
        
//        if(!(self.transaction?.buyer_confirmed_meet_up is NSNull) && !(self.transaction?.seller_confirmed_meet_up is NSNull)){
//            if(self.transaction?.buyer_confirmed_meet_up as! Bool == true){
//                sellerToBuyerArrow.image = #imageLiteral(resourceName: "arrow_icon_filled_blue")
//            }
//            else{
//                sellerToBuyerArrow.image = #imageLiteral(resourceName: "arrow_icon_blue")
//            }
//            if(self.transaction?.seller_confirmed_meet_up as! Bool == true){
//                buyerToSellerArrow.image = #imageLiteral(resourceName: "arrow_icon_filled_blue");
//            }
//            else{
//                buyerToSellerArrow.image = #imageLiteral(resourceName: "arrow_icon_blue")
//            }
//            
//        }
        let buyer_confirmed_meet_up = self.transaction?.buyer_confirmed_meet_up;
        if(!(buyer_confirmed_meet_up is NSNull) && buyer_confirmed_meet_up as! Bool == true){
             sellerToBuyerArrow.image = #imageLiteral(resourceName: "arrow_icon_filled_blue_500")
        }
        else{
            sellerToBuyerArrow.image = #imageLiteral(resourceName: "arrow_icon_blue_500");
        }
        let seller_confirmed_meet_up = self.transaction?.seller_confirmed_meet_up;
        if(!(seller_confirmed_meet_up is NSNull) && seller_confirmed_meet_up as! Bool == true){
            buyerToSellerArrow.image = #imageLiteral(resourceName: "arrow_icon_filled_blue_500")
        }
        else{
            buyerToSellerArrow.image = #imageLiteral(resourceName: "arrow_icon_blue_500")
        }
        

    }
    
}
