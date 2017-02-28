//
//  TransactionRequestCell2.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/1/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class TransactionRequestReceivedCell: UITableViewCell{
    
    var transaction: Transaction?
    
    @IBOutlet weak var declineButton: UIButton!
    @IBOutlet weak var acceptButton: UIButton!
    @IBOutlet weak var timeLabel: UILabel!
    @IBOutlet weak var distanceLabel: UILabel!
    @IBOutlet weak var yourDistanceLabel: UILabel!
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var profilePictureView: UIImageView!
    
    override func awakeFromNib() {
        timeLabel.text = nil;
        distanceLabel.text = nil;
        yourDistanceLabel.text = nil;
        profilePictureView.image = nil;
        titleLabel.text = nil;
        
    }
    
    func setTransaction(transaction: Transaction){
        self.transaction = transaction;
        let _ = Timer.scheduledTimer(timeInterval: 1.0, target: self, selector: #selector(updateExpireTime), userInfo: nil, repeats: true);
        
        //First Name Last Name is offering to Buy/Sell 'Title' for Offer Price
//        func callbackGetUser(user_info: Dictionary<String, Any>){
//            let user = User(user_info: user_info);
        if let other_user_id = transaction.getOtherUserId(){
            if let user = DataStore.get().getUserInfo(user_id: other_user_id){
                if let first_name = user.first_name{
                    if let last_name = user.last_name{
                        let users_name = user.first_name! + " " + user.last_name!;
                        let formattedString = NSMutableAttributedString()
                        let buy_or_sell = ((transaction.buy == true) ? "sell " : "buy ");
                        let from_or_to = ((transaction.buy == true) ? " to " : " from ");
                        let price = (transaction.offer != nil) ? transaction.offer! : transaction.price;
                        self.titleLabel.attributedText = formattedString.bold(text: user.first_name! + " " + user.last_name!).normal(text: " is offering to ").normal(text: buy_or_sell).bold(text: "'" + transaction.title! + "'").normal(text: from_or_to + "you for ").bold(text: (price?.toTwoDecimalPlaces())!).normal(text: " (Listing Price: " + (transaction.price?.toTwoDecimalPlaces())! + ")");
                        if user.location != nil{
                            distanceLabel.isHidden = false;
                            distanceLabel.text = users_name + "'s Distance from Meet Up Location: " + String(calculateDistance(location1: transaction.location!, location2: user.location!)) + "m"
                        }
                        else{
                            distanceLabel.isHidden = true;
                        }
                    }
                }
                
//                else{
//                    self.distanceLabel.text = users_name + "'s Distance from Meet Up Point: N/A"
//                }

            }
            if let you = DataStore.get().getUserInfo(user_id: (UserData.get()?.user_id)!){
                if let yourLocation = you.location{
                    yourDistanceLabel.isHidden = false;
                    yourDistanceLabel.text = "Your Distance from Meet Up Location: " + String(calculateDistance(location1: transaction.location!, location2: yourLocation)) + "m"
                }
            }
            else{
                yourDistanceLabel.isHidden = true;
            }
            if let profile_picture = DataStore.get().getUserProfilePicture(user_id: other_user_id){
                profilePictureView.image = profile_picture
            }
            else{
                profilePictureView.image = #imageLiteral(resourceName: "profile_pic")
            }
            
        }
       
        
        
        self.timeLabel.text = ((transaction.expiration_time != nil) ? transaction.expiration_time! :(transaction.creation_time + 60000*DataStore.get().transactionRequestResponseTime)).timeLeft();
        acceptButton.layer.borderWidth = 1;
        acceptButton.layer.borderColor = acceptButton.tintColor.cgColor;
        acceptButton.addTarget(self, action: #selector(acceptButtonClicked(button:)), for: .touchUpInside)
        declineButton.layer.borderWidth = 1;
        declineButton.layer.borderColor = declineButton.tintColor.cgColor;
        declineButton.addTarget(self, action: #selector(declineButtonClicked(button:)), for: .touchUpInside)
//        }
        func error_handler(error: String){
            print(error);
        }
//        DataStore.get().getUser(user_id: other_user_id!, callback: callbackGetUser, error_handler: error_handler)
        
    }
    
    func acceptButtonClicked(button: UIButton){
        print("Accept transaction button clicked!")
        func callback(){
            print("acceptTransaction completed successfully");
        }
        
        func error_handler(error:String){
            print(error);
        }
        DataStore.get().acceptTransactionRequest(user_id: (UserData.get()?.user_id)!, password: (UserData.get()?.password)!, transaction_id: (self.transaction?._id)!, callback: callback, error_handler: error_handler)
    }
    
    func declineButtonClicked(button: UIButton){
        print("Decline transaction button clicked!")
        func callback(){
            print("acceptTransaction completed successfully");
        }
        
        func error_handler(error:String){
            print(error);
        }
        DataStore.get().declineTransactionRequest(user_id: (UserData.get()?.user_id)!, password: (UserData.get()?.password)!, transaction_id: (self.transaction?._id)!, callback: callback, error_handler: error_handler)
    }
    
    func updateExpireTime(){
        self.timeLabel.text = ((transaction?.expiration_time != nil) ? (transaction?.expiration_time!)! :((transaction?.creation_time)! + 60000*DataStore.get().transactionRequestResponseTime)).timeLeft();
    }
    
    private func calculateDistance(location1: Location, location2: Location) -> Int{
        let distance  = Int(location1.location().distance(from: location2.location()));
        return distance;
    }
}
