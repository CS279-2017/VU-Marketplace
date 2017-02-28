//
//  ListingEditController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/16/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit
import MapKit

//extension Double{
//    func toTwoDecimalPlaces() -> String{
//        return String(format: "%.2f", self);
//    }
//}

class ListingEditController: UIViewController{
    
    var listing: Listing?
    
    
    @IBOutlet weak var titleNavigationItem: UINavigationItem!
    @IBOutlet weak var cancelButton: UIButton!
    
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var listingOwnerLabel: UILabel!
    @IBOutlet weak var priceLabel: UILabel!
    @IBOutlet weak var descriptionLabel: UILabel!
    @IBOutlet weak var expirationTimeLabel: UILabel!
    @IBOutlet weak var mapView: MKMapView!
    @IBOutlet weak var makeTransactionRequestButton: UIButton!
    @IBOutlet weak var removeListingButton: UIButton!
    @IBOutlet weak var editListingButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad();
        titleNavigationItem.title = listing?.title;
        titleLabel.text = listing?.title;
        if(listing != nil){
            if(listing?.buy == true){ listingOwnerLabel.text = "Buyer: " + (listing?.users_name)!}
            else{
                listingOwnerLabel.text = "Seller: " + (listing?.users_name)!
            }
        }

        priceLabel.text = listing?.price.toTwoDecimalPlaces();
        descriptionLabel.text = listing?.description;
        //swift time interval gives time in seconds rather than milliseconds thus we gotta divide by 1000 to get seconds
        
        //TODO: the time is a little off, the time is 7 hours ahead of the actual time, maybe its a timezone issue due is description settings?
        expirationTimeLabel.text = listing?.expiration_time.timeLeft();
//        let center = CLLocationCoordinate2D(latitude: (listing?.location["latitude"]!)!, longitude: (listing?.location["longitude"]!)!)
        if(listing != nil){
            let center = listing?.location
            let region = MKCoordinateRegion(center: (center?.coordinates())!, span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01))
            self.mapView.setRegion(region, animated: true)
            self.mapView.setCenter((center?.coordinates())!, animated: false);

        }
        let annotation = MKPointAnnotation();
        annotation.coordinate = (listing?.location.coordinates())!;
        _ = Timer.scheduledTimer(timeInterval: 1.0, target: self, selector: #selector(self.updateExpireTime), userInfo: nil, repeats: true);
        mapView.addAnnotation(annotation);
        
        cancelButton.addTarget(self, action: #selector(cancelButtonClicked(button:)), for: .touchUpInside)
        
       
        makeTransactionRequestButton.addTarget(self, action: #selector(makeTransactionRequestButtonClicked(button:)), for: .touchUpInside)
        removeListingButton.addTarget(self, action: #selector(removeListingButtonClicked(button:)), for: .touchUpInside)
        editListingButton.addTarget(self, action: #selector(editListingButtonClicked(button:)), for: .touchUpInside)
        
        //Add Logic for hiding buttons
        if(UserData.get()?.user_id == listing?.user_id){
            makeTransactionRequestButton.isHidden = true;
            removeListingButton.isHidden = false;
            editListingButton.isHidden = false;
        }
        else{
            makeTransactionRequestButton.isHidden = false;
            removeListingButton.isHidden = true;
            editListingButton.isHidden = true;
        }
        
        func listingRemovedListener(data: Any){
            print("listing_removed handler called");
            let data = data as! Dictionary<String, Any>;
            let listing_id = data["listing_id"] as! String;
            if(listing_id == self.listing?._id){
                self.dismiss(animated: true, completion: nil);
            }
        }
        DataStore.get().addListener(listener: listingRemovedListener, forEvent: "listing_removed", key: "ListingEditController");
        
    }
    
    @objc private func updateExpireTime(){
        expirationTimeLabel.text = listing?.expiration_time.timeLeft();
    }
    
    func setListing(listing: Listing){
        self.listing = listing;
    }
    
    func cancelButtonClicked(button: UIButton){
        self.dismiss(animated: true, completion: nil)
    }
    
    func removeListingButtonClicked(button: UIButton){
        let user_id = UserData.get()?.user_id;
        let password = UserData.get()?.password;
        let listing_id = self.listing?._id;

        func callback(){
            self.dismiss(animated: true, completion: nil);
        }
        
        func error_handler(error:String){
            print(error);
        }
        DataStore.get().removeListing(user_id: user_id!, password: password!, listing_id: listing_id!, callback: callback, error_handler: error_handler);
    }
    
    func editListingButtonClicked(button: UIButton){
        
    }
    
    func makeTransactionRequestButtonClicked(button: UIButton){
        let user_id = UserData.get()?.user_id;
        let password = UserData.get()?.password;
        let listing_id = self.listing?._id;
        
        func callback(){
            self.dismiss(animated: true, completion: nil);
        }
        DataStore.get().makeTransactionRequest(user_id: user_id!, password: password!, listing_id: listing_id!, callback: callback, error_handler: DataStore.get().error_handler);
    }
    
}
