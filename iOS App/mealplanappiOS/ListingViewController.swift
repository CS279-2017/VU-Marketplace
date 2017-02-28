//
//  ListingEditorController2.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/29/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import Foundation
import UIKit
import MapKit



class ListingViewController: UIViewController, UITableViewDelegate, UITableViewDataSource{
    
    var listing: Listing?
    
    @IBOutlet weak var tableView: UITableView!
    
    @IBOutlet weak var titleNavigationItem: UINavigationItem!
    
    @IBOutlet weak var editButton: UIButton!
    @IBOutlet weak var cancelButton: UIButton!
    override func viewDidLoad() {
        super.viewDidLoad();
        tableView.delegate = self;
        tableView.dataSource = self;
        tableView.tableFooterView = UIView();
        
        tableView.rowHeight = UITableViewAutomaticDimension
        tableView.estimatedRowHeight = 280
        
        tableView.allowsSelection = false;
        
        if(self.listing == nil || UserData.get()?.user_id != self.listing?.user_id){
            editButton.isHidden = true;
        }
        else{
            editButton.isHidden = false;
        }
        
        titleNavigationItem.title = listing?.title;
        
        func listingRemovedListener(data: Any){
            print("listing_removed handler called");
            let data = data as! Dictionary<String, Any>;
            let listing_id = data["listing_id"] as! String;
            if(listing_id == self.listing?._id){
                self.dismiss(animated: true, completion: nil);
            }
        }
        
        DataStore.get().addListener(listener: listingRemovedListener, forEvent: "listing_removed", key: "ListingViewController");
        
        func listingUpdatedListener(data: Any){
            print("listing_updated handler called");
            let data = data as! Dictionary<String, Any>
            let updated_dictionary = data["listing"] as! Dictionary<String, Any>;
            let updated_listing = Listing(dictionary: updated_dictionary);
            if(self.listing != nil && updated_listing._id == self.listing?._id){
                self.listing?.update(listing: updated_listing);
                let indexPath1 = NSIndexPath(row: 1, section: 0)
                let indexPath2 = NSIndexPath(row: 0, section: 0)
                self.tableView.reloadRows(at: [indexPath1 as IndexPath, indexPath2 as IndexPath], with: UITableViewRowAnimation.automatic)
                self.titleNavigationItem.title = self.listing?.title;
            }
        }
        DataStore.get().addListener(listener: listingUpdatedListener, forEvent: "listing_updated", key: "ListingViewController");
        
        cancelButton.addTarget(self, action: #selector(cancelButtonClicked(button:)), for: .touchUpInside);
        editButton.addTarget(self, action: #selector(editButtonClicked(button:)), for: .touchUpInside)
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(false)
        initReconnectTimer();
//        if listing != nil{
//            func callback(dictionary: [String: Any]){
//                let listing = Listing(dictionary: dictionary);
//                self.setListing(listing: listing);
//                tableView.reloadData();
//            }
//            DataStore.get().getListing(listing_id: (listing?._id)!, callback: callback, error_handler: DataStore.get().error_handler)
//        }
    }
    
    func setListing(listing: Listing){
        self.listing = listing;
//        tableView.reloadData();
    }
    
    func cancelButtonClicked(button: UIButton){
        self.dismiss(animated: true, completion: nil)
    }
    
    func editButtonClicked(button: UIButton){
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        let controller = storyboard.instantiateViewController(withIdentifier: "MakeListingController2") as! MakeListingController2
        controller.initializeForEditing(listing: listing!)
        self.present(controller, animated: true, completion: nil)
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        //
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if(listing != nil){
            return 4;
        }
        return 0;
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if(self.listing != nil){
            if(indexPath.row == 0){
                let cell = tableView.dequeueReusableCell(withIdentifier: "MapCell") as! MapCell;
                cell.setListing(listing: self.listing);
                return cell;
            }
            else if(indexPath.row == 1){
                let cell = tableView.dequeueReusableCell(withIdentifier: "ListingCell") as! ListingCell;
                cell.setListing(listing: self.listing!);
                return cell;
            }
            else if(indexPath.row == 2){
                let cell = tableView.dequeueReusableCell(withIdentifier: "PicturesCell") as! PicturesCell;
//                cell.setListing(listing: self.listing!)
                cell.setType(type: .view)
                if let picture_ids = listing?.picture_ids{
                    var pictures = [Picture]();
                    for picture_id in picture_ids{
                        pictures.append(Picture(image: nil, picture_id: picture_id))
                    }
                    cell.setListing(listing: self.listing!)
                    cell.setPictures(pictures: pictures)
                    if(pictures.count == 0){
                        cell.isHidden = true;
                    }
                }
                //            cell.setImages(images: nil);
                return cell;
            }
            else if(indexPath.row == 3){
                let cell = tableView.dequeueReusableCell(withIdentifier: "ButtonCell") as! ButtonCell;
                var buttonInfoArray = [ButtonInfo]();
                
                if(UserData.get()?.user_id == listing?.user_id){
                    buttonInfoArray.append(ButtonInfo(title: "Remove Listing", handler: removeListingButtonClicked, selected: nil));
                }
                else{
                    buttonInfoArray.append(ButtonInfo(title: "Request Transaction", handler: makeTransactionRequestButtonClicked, selected: nil));
                }
                cell.setButtons(buttonInfoArray: buttonInfoArray);
                return cell;
            }
        }
        return UITableViewCell();
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
        
        let alertController = UIAlertController(title: "Are you sure you want to remove this listing?", message: "", preferredStyle: UIAlertControllerStyle.alert)
        let terminateAction = UIAlertAction(title: "Remove Listing", style: UIAlertActionStyle.destructive) { (result : UIAlertAction) -> Void in
            DataStore.get().removeListing(user_id: user_id!, password: password!, listing_id: listing_id!, callback: callback, error_handler: error_handler);
        }
        let cancelAction = UIAlertAction(title: "Cancel", style: UIAlertActionStyle.cancel) { (result : UIAlertAction) -> Void in
            
        }
        alertController.addAction(terminateAction)
        alertController.addAction(cancelAction)
        self.present(alertController, animated: true, completion: nil)
        
    }
    
    func makeTransactionRequestButtonClicked(button: UIButton){
        let user_id = UserData.get()?.user_id;
        let password = UserData.get()?.password;
        let listing_id = self.listing?._id;
        
        func callback(){
            self.dismiss(animated: true, completion: nil);
        }
        let alertController = UIAlertController(title: "Transaction Request", message: "Offer A New Price Or Keep The Listing Price", preferredStyle: UIAlertControllerStyle.alert)
        let confirmAction = UIAlertAction(title: "Request Transaction", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
            let textField = alertController.textFields![0]
            if let offer = textField.text?.toPrice(){
                 DataStore.get().makeTransactionRequest(user_id: user_id!, password: password!, listing_id: listing_id!, callback: callback, error_handler: DataStore.get().error_handler, offer: offer);
            }
            else{
                DataStore.get().error_handler(error: "Must enter a valid price amount!");
            }
        }
        let cancelAction = UIAlertAction(title: "Cancel", style: UIAlertActionStyle.cancel) { (result : UIAlertAction) -> Void in
            
        }
        alertController.addTextField { (textField) in
            textField.text = self.listing?.price.toTwoDecimalPlaces();
            textField.keyboardType = .decimalPad;
        }
        alertController.addAction(confirmAction)
        alertController.addAction(cancelAction)
        self.present(alertController, animated: true, completion: nil)
        
    }
    
//    @objc private func updateExpireTimesForAllCells(){
//        let cells = tableView.visibleCells;
//        for cell in cells{
////            let listingCell = cell as! ListingCell;
//            if(cell is ListingCell){
//                if let expiration_time = listingCell.listing?.expiration_time{
//                    if(expiration_time > 0){
//                        listingCell.listing!.expiration_time -= 1;
//                    }
//                }
//            }
//        }
//        tableView.reloadData();
//    }
//
//        _ = Timer.scheduledTimer(timeInterval: 1.0, target: self, selector: #selector(self.updateExpireTime), userInfo: nil, repeats: true);
//        cancelButton.addTarget(self, action: #selector(cancelButtonClicked(button:)), for: .touchUpInside)
//        
//        
//        makeTransactionRequestButton.addTarget(self, action: #selector(makeTransactionRequestButtonClicked(button:)), for: .touchUpInside)
//        removeListingButton.addTarget(self, action: #selector(removeListingButtonClicked(button:)), for: .touchUpInside)
//        editListingButton.addTarget(self, action: #selector(editListingButtonClicked(button:)), for: .touchUpInside)
//        
//        //Add Logic for hiding buttons
//        if(UserData.get()?.user_id == listing?.user_id){
//            makeTransactionRequestButton.isHidden = true;
//            removeListingButton.isHidden = false;
//            editListingButton.isHidden = false;
//        }
//        else{
//            makeTransactionRequestButton.isHidden = false;
//            removeListingButton.isHidden = true;
//            editListingButton.isHidden = true;
//        }
    
//    }
//
//    @objc private func updateExpireTime(){
//        expirationTimeLabel.text = listing?.expiration_time.timeLeft();
//    }
//
//
//    func cancelButtonClicked(button: UIButton){
//        self.dismiss(animated: true, completion: nil)
//    }
//    

//    
//    func editListingButtonClicked(button: UIButton){
//        
//    }
//    
    
}
