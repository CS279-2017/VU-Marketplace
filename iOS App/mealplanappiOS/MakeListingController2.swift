//
//  MakeListingController2.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/13/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class MakeListingController2: UIViewController, UITableViewDelegate, UITableViewDataSource, SelectLocationDelegate, UIGestureRecognizerDelegate{
    
    @IBOutlet weak var tableView: UITableView!
    @IBOutlet weak var cancelButton: UIButton!
    
    var keyboardHeightLayoutConstraint: NSLayoutConstraint?
    
    var selectedLocation:[String: Double]?
    
    var isEditingListing = false;
    
    var listing: Listing?
    
    var mapCell:MapCell?
    
    var datePicker: UIDatePicker?
    
    var buyOrSell:Bool?;
    
    var activeView: UIView?
    
    var titleTextField: UITextField?
    var priceTextField: UITextField?
    var locationTextField: UITextField?
    var descriptionTextView: UITextView?
    var expirationTimeTextField: UITextField?
    
    var picturesCell: PicturesCell?

    @IBOutlet weak var navigationBarTitle: UINavigationItem!
//    @IBOutlet weak var makeListingButton: UIButton!
    
    var makeListingButton: UIButton?
    
    override func viewDidLoad() {
        tableView.delegate = self;
        tableView.dataSource = self;
        tableView.tableFooterView = UIView();
        
        tableView.rowHeight = UITableViewAutomaticDimension
        tableView.estimatedRowHeight = 280
        
        tableView.allowsSelection = false;
        
        hideKeyboardWhenTappedAround();
        
        cancelButton.addTarget(self, action: #selector(cancelButtonClicked), for: .touchUpInside)
        
        navigationBarTitle.title = isEditingListing ? "Edit Listing" : "Make New Listing"
        
//        makeListingButton.addTarget(self, action: #selector(makeListingButtonClicked(button:)), for: .touchUpInside)
//        makeListingButton?.setTitle(isEditingListing ? "Save" : "Make", for: .normal)
        
        
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWasShown(notification:)), name: NSNotification.Name.UIKeyboardWillShow, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillBeHidden(notification:)), name: NSNotification.Name.UIKeyboardWillHide, object: nil);

        
    }
    
    override func viewWillAppear(_ animated: Bool) {
        initReconnectTimer();
    }
    
    func initializeForEditing(listing: Listing){
        self.listing = listing;
        isEditingListing = true;
        selectedLocation = ["latitude": (listing.location?.latitude!)!, "longitude": (listing.location?.longitude!)!];
    }
    
    func locationSelected(location: [String : Double]) {
        selectedLocation = location;
        //convert latitude and longitude of location into a string and display in textField
        self.mapCell?.setLocation(location: Location(latitude: location["latitude"]!, longitude: location["longitude"]!, last_update_time: nil));
    }
    
    func numberOfSections(in tableView: UITableView) -> Int {
        return 5;
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
    }
    
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        if(section == 2){
            return "Add Pictures Of The Item You Are Selling";
        }
        if(section == 3){
            return "Tap On The Map To Select A Location"
        }
        return nil;
    }
    
//    func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
//        let label = UILabel();
//        label.font = UIFont.systemFont(ofSize: 12)
//        label.minimumScaleFactor = 0.5
//        if(section == 2){
//            label.text = "  Add Pictures Of The Item You Are Selling";
//            label.adjustsFontSizeToFitWidth = true;
//            return label;
//        }
//        if(section == 3){
//            label.text = "  Tap On The Map To Select A Location";
//            label.adjustsFontSizeToFitWidth = true;
//            return label;
//        }
//        return nil;
//    }
//    
//    func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
//        if(section == 2 || section == 3){
//           return 32;
//        }
//        return 0;
//    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        var title: String?
        var description:String?
        var price:Double?
        var date:Date?;
        if let listing = self.listing{
            self.buyOrSell = listing.buy
            title = listing.title
            description = listing.description
            price = listing.price
            date = Date(timeIntervalSince1970: TimeInterval((listing.expiration_time)! / 1000))
        }
        if(indexPath.section == 0){
            let cell = tableView.dequeueReusableCell(withIdentifier: "RadioButtonCell", for: indexPath) as! RadioButtonCell
            var buttonInfoArray = [ButtonInfo]();
            buttonInfoArray.append(ButtonInfo(title: "Buy", handler: toggleBuySell, selected: self.buyOrSell));
            buttonInfoArray.append(ButtonInfo(title: "Sell", handler: toggleBuySell, selected: self.buyOrSell != nil ? !(self.buyOrSell!) : nil));
            cell.setButtons(buttonInfoArray: buttonInfoArray, orientation: nil);
            return cell;
        }
        if(indexPath.section == 1){
            let cell = tableView.dequeueReusableCell(withIdentifier: "TextFieldCell", for: indexPath) as! TextFieldCell
            var textFieldInfoArray = [TextFieldInfo]();
            if(indexPath.row == 0){
                textFieldInfoArray.append(TextFieldInfo(placeholder: "Enter Title", type: .singleLine, text: title, keyboardType: nil, maxLength: 60));
                cell.setTextFields(textFieldInfoArray: textFieldInfoArray)
                self.titleTextField = cell.textField;
            }
            else if(indexPath.row == 1){
                textFieldInfoArray.append(TextFieldInfo(placeholder: "Enter A Price", type: .singleLine, text:  price != nil ? price?.toTwoDecimalPlaces().replacingOccurrences(of: "FREE", with: "$0.00") : nil, keyboardType: UIKeyboardType.decimalPad, maxLength: 15));
                cell.setTextFields(textFieldInfoArray: textFieldInfoArray)
                self.priceTextField = cell.textField;


            }
            else if(indexPath.row == 2){
                let cell = tableView.dequeueReusableCell(withIdentifier: "TextViewCell", for: indexPath) as! TextViewCell
                cell.setTextFieldInfo(textFieldInfo: TextFieldInfo(placeholder: "Enter A Description", type: .singleLine, text: description, keyboardType: nil, maxLength: 400))
                self.descriptionTextView = cell.textView;
                return cell;

            }
//            else if(indexPath.row == 3){
//                let dateFormatter = DateFormatter()
//                dateFormatter.dateStyle = DateFormatter.Style.short
//                dateFormatter.timeStyle = DateFormatter.Style.short
//                var strDate: String?;
//                if let date = date{
//                    strDate = dateFormatter.string(from: date)
//                }
//                textFieldInfoArray.append(TextFieldInfo(placeholder: "Select An Expiration Time", type: .date, text: strDate != nil ? strDate! : nil, keyboardType: nil, maxLength: 50));
//                cell.setTextFields(textFieldInfoArray: textFieldInfoArray)
//                expirationTimeTextField = cell.textField;
//                cell.tableView = self.tableView;
//                self.datePicker = cell.datePicker;
//                if let date = date{
//                    self.datePicker?.date = date;
//                }
//               
//
//            }
            return cell;
        }
        else if(indexPath.section == 2){
            let cell = tableView.dequeueReusableCell(withIdentifier: "PicturesCell") as! PicturesCell;
            if(listing != nil){
                 cell.setListing(listing: self.listing!)
            }
            if(isEditingListing){
                cell.setType(type: .edit)
            }
            else{
                cell.setType(type: .makeListing)
            }
            if let picture_ids = listing?.picture_ids{
                var pictures = [Picture]();
                for picture_id in picture_ids{
                    pictures.append(Picture(image: nil, picture_id: picture_id))
                }
                cell.setPictures(pictures: pictures)
            }
            self.picturesCell = cell;

            
//            cell.setImages(images: nil);
            return cell;
        }
        else if(indexPath.section == 3){
            let cell = tableView.dequeueReusableCell(withIdentifier: "MapCell", for: indexPath) as! MapCell
            if selectedLocation != nil{
                cell.setLocation(location: Location(latitude: (selectedLocation?["latitude"])!, longitude: (selectedLocation?["longitude"]!)!, last_update_time: nil));
            }
            else{
                cell.setLocation(location: nil);
            }
            self.mapCell = cell;
            let tap = UITapGestureRecognizer.init(target: self, action: #selector(mapViewTapped));
            cell.mapView.addGestureRecognizer(tap);
//            cell.mapView.isScrollEnabled = false;
//            cell.mapView.isZoomEnabled = false;
            cell.mapView.isRotateEnabled = false;
            cell.mapView.isPitchEnabled = false;
            return cell;
        }
        else if(indexPath.section == 4){
            let cell = tableView.dequeueReusableCell(withIdentifier: "ButtonCell", for: indexPath) as! ButtonCell
            var buttonInfoArray = [ButtonInfo]();
            buttonInfoArray.append(ButtonInfo(title: isEditingListing ? "Save Changes" : "Make Listing", handler: makeListingButtonClicked, selected: nil));
            cell.setButtons(buttonInfoArray: buttonInfoArray);
            return cell;
        }
        
        return UITableViewCell();
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        if(indexPath.section == 3){
            return 140;
        }
        return UITableViewAutomaticDimension
    }
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if(section == 1){
            return 3;
        }
        return 1;
    }
    

    func cancelButtonClicked(button: UIButton){
        self.dismiss(animated: true, completion: nil);
    }
    
    func mapViewTapped(){
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        let controller = storyboard.instantiateViewController(withIdentifier: "SelectLocationController") as! SelectLocationController
        if(selectedLocation != nil){
            controller.setLocation(location: Location(dictionary: selectedLocation!))
        }
        controller.delegate = self;
        self.present(controller, animated: true, completion: nil)
    }
    
    func makeListingButtonClicked(button: UIButton){
        let userData = UserData.get();
        //error handler in case userData is nil implying user hasn't logged in
        if(userData == nil){
            print("makeListing: userData was nil, must login first")
        }
        else{
            
            guard let user_id:String = userData!.user_id else{
                return;
            }
            guard let password:String = userData!.password else{
                return;
            }
            //TODO: validate to make sure all fields have been selected (or do this on the server-side)
            guard let titleText = titleTextField?.text else{
                DataStore.get().error_handler(error: "Please enter a title");
                return;
            }
            let title:String = titleText.trimmingCharacters(in: CharacterSet.whitespaces)
            guard let descriptionText = descriptionTextView?.text else{
                DataStore.get().error_handler(error: "Please enter a description");
                return;
            }
            let description = descriptionText.trimmingCharacters(in: CharacterSet.whitespaces)
            guard let location = selectedLocation else{
                DataStore.get().error_handler(error: "Please select a location");
                return;
            }
            //this gives seconds rather than milliseconds thus we need to multiply by 1000
            let expiration_time = (datePicker?.date.timeIntervalSince1970)! * 1000
            guard let priceText = priceTextField?.text else{
                DataStore.get().error_handler(error: "Please enter a price");
                return;
            }
            guard let price = Double(priceText.replacingOccurrences(of: "$", with: "")) else{
                DataStore.get().error_handler(error: "Please enter a number for the price");
                return;
            }
            guard let buy = buyOrSell else{
                DataStore.get().error_handler(error: "Please select buy or sell");
                return;
            }
            
            if (self.picturesCell?.pictures.count)! > DataStore.get().maxPicturesPerListing{
                DataStore.get().error_handler(error: "You can only have a maximum of " + String(DataStore.get().maxPicturesPerListing) + " pictures per listing");
                return;
            }
            
            func callback(listing: Listing){
                //TODO: go back to listing page
                
                for picture in (self.picturesCell?.pictures)!{
                    if(picture._id == nil && picture.image != nil){
                        let picture_data = UIImageJPEGRepresentation(picture.image!, 1.0);
//                        while((picture_data?.count)! > 100000){
//                            picture_data = UIImageJPEGRepresentation(UIImage(data: picture_data!)!, 0.10);
//                        }
                       
                            //            if(picture_data.count > 100000){
                        DataStore.get().addPictureToListing(user_id: (UserData.get()?.user_id)!, password: UserData.get()!.password!, listing_id: listing._id, picture: picture_data!, callback: {}, error_handler: {_ in })
                    }
                    else if(picture._id != nil && picture.image != nil){
                        let picture_data = UIImageJPEGRepresentation(picture.image!, 1.0);
//                        while((picture_data?.count)! > 100000){
//                            picture_data = UIImageJPEGRepresentation(UIImage(data: picture_data!)!, 0.10);
//                        }
                        DataStore.get().updatePicture(user_id: (UserData.get()?.user_id)!, password: (UserData.get()?.password)!, picture_id: picture._id!, picture: picture_data!, callback: {}, error_handler: {_ in });
                    }
                }
                if let deleted_pictures = self.picturesCell?.deleted_pictures{
                    for pic in deleted_pictures{
                        DataStore.get().deletePictureFromListing(user_id: UserData.get()!.user_id!, password: (UserData.get()?.password!)!, listing_id: self.listing!._id, picture_id: pic._id!, callback: {}, error_handler: DataStore.get().error_handler)
                    }
                }
                if(isEditingListing){
                    self.dismiss(animated: true, completion: nil)
                }
                else{
                    let rootViewController =  UIApplication.shared.keyWindow?.rootViewController;
                    rootViewController?.dismiss(animated: false, completion: nil)
                    if let tabBarController = rootViewController as? UITabBarController{
                        tabBarController.selectedIndex = 0
                        if let listingController = tabBarController.selectedViewController as? ListingController{
                            listingController.segmentedControl.selectedSegmentIndex = 2;
                        }
                    }

                }
            }
            if(isEditingListing){
                DataStore.get().updateListing(user_id: user_id, password: password, listing_id: (listing?._id)!, title: title, description: description, location: location, expiration_time: expiration_time, price: price, buy: buy, callback: callback, error_handler: DataStore.get().error_handler)
            }
            else{
                DataStore.get().makeListing(user_id: user_id, password: password, title: title, description: description, location: location, expiration_time: expiration_time, price: price, buy: buy, callback: callback, error_handler: DataStore.get().error_handler)
            }
        }
    }
    
    func toggleBuySell(button: UIButton){
        if(button.titleLabel?.text == "Buy"){
            buyOrSell = true;
        }
        else{
            buyOrSell = false;
        }
        print("buyOrSell: " + String(describing: buyOrSell));
    }
    
    func keyboardNotification(notification: NSNotification) {
        if let userInfo = notification.userInfo {
            let endFrame = (userInfo[UIKeyboardFrameEndUserInfoKey] as? NSValue)?.cgRectValue
            let duration:TimeInterval = (userInfo[UIKeyboardAnimationDurationUserInfoKey] as? NSNumber)?.doubleValue ?? 0
            let animationCurveRawNSN = userInfo[UIKeyboardAnimationCurveUserInfoKey] as? NSNumber
            let animationCurveRaw = animationCurveRawNSN?.uintValue ?? UIViewAnimationOptions.curveEaseInOut.rawValue
            let animationCurve:UIViewAnimationOptions = UIViewAnimationOptions(rawValue: animationCurveRaw)
            if (endFrame?.origin.y)! >= UIScreen.main.bounds.size.height {
                self.keyboardHeightLayoutConstraint?.constant = 0.0
            } else {
                self.keyboardHeightLayoutConstraint?.constant = endFrame?.size.height ?? 0.0
            }
            UIView.animate(withDuration: duration,
                           delay: TimeInterval(0),
                           options: animationCurve,
                           animations: { self.view.layoutIfNeeded() },
                           completion: nil)
        }
    }
    
    func keyboardWasShown(notification: NSNotification){
        //Need to calculate keyboard exact size due to Apple suggestions
//        self.tableView.isScrollEnabled = true
//        var info = notification.userInfo!
//        let keyboardSize = (info[UIKeyboardFrameBeginUserInfoKey] as? NSValue)?.cgRectValue.size
//        let contentInsets : UIEdgeInsets = UIEdgeInsetsMake(0.0, 0.0, keyboardSize!.height, 0.0)
        
//        self.tableView.contentInset = contentInsets
//        self.tableView.scrollIndicatorInsets = contentInsets
        
//        var aRect : CGRect = self.view.frame
//        aRect.size.height -= keyboardSize!.height
//        tableView.scrollToRow(at: IndexPath(row: 0, section: 3), at: .bottom, animated: true)
    }
    
    func keyboardWillBeHidden(notification: NSNotification){
        //Once keyboard disappears, restore original positions
//        var info = notification.userInfo!
//        let keyboardSize = (info[UIKeyboardFrameBeginUserInfoKey] as? NSValue)?.cgRectValue.size
//        let contentInsets : UIEdgeInsets = UIEdgeInsetsMake(0.0, 0.0, -keyboardSize!.height, 0.0)
//        self.tableView.contentInset = contentInsets
//        self.tableView.scrollIndicatorInsets = contentInsets
        self.view.endEditing(true)
//        self.tableView.isScrollEnabled = false
    }
    
    override func hideKeyboardWhenTappedAround() {
        let tap: UITapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(UIViewController.dismissKeyboard))
        tap.delegate = self;
        tap.delaysTouchesEnded = false;
        tap.cancelsTouchesInView = false;
        tap.delaysTouchesBegan = false;
        view.addGestureRecognizer(tap)
        
    }
    override func dismissKeyboard() {
        view.endEditing(true)
    }
    
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        if(touch.view?.tag == 100){
            return false;
        }
        return true;
    }
}
