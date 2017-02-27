//
//  MarkAsSoldButtonCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/31/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class MarkAsSoldButtonCell: UITableViewCell{
    var listing: Listing?
    
    @IBOutlet weak var button: UIButton!
    
    func set(listing: Listing){
        self.listing = listing;
        if(listing.sold == false){
            button.isEnabled = true;
            button.setTitle("Mark As Sold", for: .normal)
        }
        else{
            button.isEnabled = false;
            button.setTitle("Sold", for: .normal)
        }
        button.addTarget(self, action: #selector(buttonClicked), for: .touchUpInside)
    }
    
    func buttonClicked(){
        
        let alertController = UIAlertController(title: "Mark As Sold", message: "Are you sure you want to mark this listing as sold?", preferredStyle: UIAlertControllerStyle.alert)
        let yesAction = UIAlertAction(title: "Mark As Sold", style: UIAlertActionStyle.destructive) { (result : UIAlertAction) -> Void in
            if let listing = self.listing{
                DataStore.get().markListingAsSold(listing_id: (self.listing?._id)!, callback: {
                    self.button.isEnabled = false;
                    self.button.setTitle("Sold", for: .normal)
                    listing.sold = true;
                }, error_handler: DataStore.get().error_handler)
            }

        }
        let cancelAction = UIAlertAction(title: "Cancel", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
        }
        alertController.addAction(yesAction)
        alertController.addAction(cancelAction)
        UIApplication.topViewController()?.present(alertController, animated: true, completion: nil)
    }
    
}

