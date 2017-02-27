//
//  MakeListingController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/11/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import Foundation
import UIKit



class MakeListingController: UIViewController, UITextFieldDelegate, UITextViewDelegate, SelectLocationDelegate{
    @IBOutlet weak var scrollView: UIScrollView!
    @IBOutlet weak var buyOrSellSwitch: UISwitch!
    @IBOutlet weak var cancelButton: UIButton!
    
    @IBOutlet weak var titleTextField: UITextField!
    
    
//    let placeHolderText = "Please Enter a Description";

    
//    @IBOutlet weak var descriptionTextField: UITextField!
    
    @IBOutlet weak var priceTextField: UITextField!
    
    @IBOutlet weak var locationTextField: UITextField!
    @IBOutlet weak var descriptionTextView: UITextView!
    
    @IBOutlet weak var expirationTimeTextField: UITextField!
    
    @IBOutlet weak var makeListingButton: UIButton!
    
    var selectedLocation:[String: Double]?
    var expirationTime:Double?
    
    var isEditingListing = false;
    
    var listing: Listing?
    
    var activeField: UITextField?
    
    var datePicker = UIDatePicker();
    
    var placeHolderLabel = UILabel();
    
    
    
//    var location: Coordi;
//    var expiration_time;
    
    override func viewDidLoad() {
        super.viewDidLoad();
//        if(DataStore.get().getControllerWithIdentifier(identifier: "MakeListingController") == nil){
//            DataStore.get().addControllerWithIdentifier(identifier: "MakeListingController", controller: self)
//        }
        self.hideKeyboardWhenTappedAround()
        titleTextField.returnKeyType = .done
        titleTextField.delegate = self;
        descriptionTextView.returnKeyType = .done
        descriptionTextView.delegate = self;
        priceTextField.returnKeyType = .done;
        priceTextField.delegate = self;
        locationTextField.returnKeyType = .done;
        locationTextField.delegate = self;
        expirationTimeTextField.returnKeyType = .done
        expirationTimeTextField.delegate = self;
        
        descriptionTextView.layer.borderWidth = 0.5;
        
        descriptionTextView.layer.borderColor = DataStore.get().placeHolderColor.cgColor
        descriptionTextView.layer.cornerRadius = 5;
    
        placeHolderLabel.text = "Enter A Description"
        placeHolderLabel.font = UIFont.systemFont(ofSize: (descriptionTextView.font?.pointSize)!)
        placeHolderLabel.sizeToFit()
        descriptionTextView.addSubview(placeHolderLabel)
        placeHolderLabel.frame.origin = CGPoint(x: 5, y: (descriptionTextView.font?.pointSize)! / 2)
        placeHolderLabel.textColor = DataStore.get().placeHolderColor;
        placeHolderLabel.isHidden = !descriptionTextView.text.isEmpty
//        expirationTimePicker.isHidden = true;
        //adds callback for when the value of picker changes, then changes the expirationTimeTextField
//        expirationTimePicker.addTarget(self, action: #selector(expirationTimePickerChanged(datePicker:)), for: UIControlEvents.valueChanged)
        
        //use touchDown for textfields since we want to trigger the event right away
//        expirationTimeTextField.addTarget(self, action: #selector(expirationTimeTextFieldClicked(textField:)), for: .touchDown)
        locationTextField.addTarget(self, action: #selector(locationTextFieldClicked(textField:)), for: .touchDown)
        
        //use touchupinside for buttons
        cancelButton.addTarget(self, action: #selector(cancelButtonClicked(button:)), for: .touchUpInside)
        
        makeListingButton.setTitle("Make Listing", for: .normal)
        
        makeListingButton.addTarget(self, action: #selector(makeListingButtonClicked(button:)), for: .touchUpInside)
        makeListingButton.layer.borderWidth = 1;
        makeListingButton.layer.borderColor = makeListingButton.tintColor.cgColor;
        
        
        datePicker.datePickerMode = UIDatePickerMode.dateAndTime
        datePicker.addTarget( self, action: #selector(expirationTimePickerChanged(datePicker:)), for: UIControlEvents.valueChanged )
        
        scrollView.delaysContentTouches = false;

        
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWasShown(notification:)), name: NSNotification.Name.UIKeyboardWillShow, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillBeHidden(notification:)), name: NSNotification.Name.UIKeyboardWillHide, object: nil)
        
    }
    func keyboardWasShown(notification: NSNotification){
        //Need to calculate keyboard exact size due to Apple suggestions
        self.scrollView.isScrollEnabled = true
        var info = notification.userInfo!
        let keyboardSize = (info[UIKeyboardFrameBeginUserInfoKey] as? NSValue)?.cgRectValue.size
        let contentInsets : UIEdgeInsets = UIEdgeInsetsMake(0.0, 0.0, keyboardSize!.height, 0.0)
        
        self.scrollView.contentInset = contentInsets
        self.scrollView.scrollIndicatorInsets = contentInsets
        
        var aRect : CGRect = self.view.frame
        aRect.size.height -= keyboardSize!.height
        if let activeField = self.activeField {
            if (!aRect.contains(activeField.frame.origin)){
                self.scrollView.scrollRectToVisible(activeField.frame, animated: true)
            }
        }
    }
    
    func keyboardWillBeHidden(notification: NSNotification){
        //Once keyboard disappears, restore original positions
        var info = notification.userInfo!
        let keyboardSize = (info[UIKeyboardFrameBeginUserInfoKey] as? NSValue)?.cgRectValue.size
        let contentInsets : UIEdgeInsets = UIEdgeInsetsMake(0.0, 0.0, -keyboardSize!.height, 0.0)
        self.scrollView.contentInset = contentInsets
        self.scrollView.scrollIndicatorInsets = contentInsets
        self.view.endEditing(true)
        self.scrollView.isScrollEnabled = false
    }
    
    override func viewWillAppear(_ animated: Bool) {
        if(isEditingListing && listing != nil){
            makeListingButton.setTitle("Save Changes", for: .normal)
            buyOrSellSwitch.isOn = (listing?.buy)!
            titleTextField.text = listing?.title
            descriptionTextView.text = listing?.description
            placeHolderLabel.isHidden = (descriptionTextView.text != "")
            priceTextField.text = listing?.price.toTwoDecimalPlaces();
            if(selectedLocation == nil){
                locationTextField.text = listing?.location.toString();
            }
            else{
                locationTextField.text = Location(dictionary: selectedLocation!).toString();
            }
            let date = Date(timeIntervalSince1970: TimeInterval((listing?.expiration_time)! / 1000))
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = DateFormatter.Style.short
            dateFormatter.timeStyle = DateFormatter.Style.short
            let strDate = dateFormatter.string(from: date)
            expirationTimeTextField.text = strDate
            datePicker.date = date;
        }
    }
    
    
    func cancelButtonClicked(button: UIButton){
        self.dismiss(animated: true, completion: nil)
    }
    
    func locationTextFieldClicked(textField: UITextField){
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        let controller = storyboard.instantiateViewController(withIdentifier: "SelectLocationController") as! SelectLocationController
        if(selectedLocation != nil){
            controller.setLocation(location: Location(dictionary: selectedLocation!))
        }
//        else{
//        }
        controller.delegate = self;
        self.present(controller, animated: true, completion: nil)

    }
    
    //show picker upon being clicked
//    func expirationTimeTextFieldClicked(textField: UITextField){
//        expirationTimePicker.isHidden = !expirationTimePicker.isHidden;
//    }
    
    //1. get socket from DataStore
    //2. remove handler any prior handler for 'make_listing_response'
    //3. add handler for 'make_listing_response'
    //  *handler should take users to the my listings segment of the Listings Tab
    //4. emit make_listing_data
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
            guard let titleText = titleTextField.text else{
                DataStore.get().error_handler(error: "Please enter a title");
                return;
            }
            let title:String = titleText.trimmingCharacters(in: CharacterSet.whitespaces)
            guard let descriptionText = descriptionTextView.text else{
                DataStore.get().error_handler(error: "Please enter a description");
                return;
            }
            let description = descriptionText.trimmingCharacters(in: CharacterSet.whitespaces)
            guard let location = selectedLocation else{
                DataStore.get().error_handler(error: "Please select a location");
                return;
            }
            //this gives seconds rather than milliseconds thus we need to multiply by 1000
            let expiration_time = datePicker.date.timeIntervalSince1970 * 1000
            guard let priceText = priceTextField.text else{
                DataStore.get().error_handler(error: "Please enter a price");
                return;
            }
            guard let price = Double(priceText) else{
                DataStore.get().error_handler(error: "Please enter a number for the price");
                return;
            }
            let buy = buyOrSellSwitch.isOn
            func callback(listing: Listing){
                //TODO: go back to listing page
                self.dismiss(animated: true, completion: nil)
//                let storyboard = UIStoryboard(name: "Main", bundle: nil)
//                let controller = storyboard.instantiateViewController(withIdentifier: "ListingController")
//                self.present(controller, animated: true, completion: nil)
            }
            if(isEditingListing){
                DataStore.get().updateListing(user_id: user_id, password: password, listing_id: (listing?._id)!, title: title, description: description, location: location, expiration_time: expiration_time, price: price, buy: buy, callback: callback, error_handler: DataStore.get().error_handler)
            }
            else{
                DataStore.get().makeListing(user_id: user_id, password: password, title: title, description: description, location: location, expiration_time: expiration_time, price: price, buy: buy, callback: callback, error_handler: DataStore.get().error_handler)
            }
        }
    }
    
    func initializeForEditing(listing: Listing){
        self.listing = listing;
        isEditingListing = true;
        selectedLocation = ["latitude": listing.location.latitude, "longitude": listing.location.longitude];
    }
    
    //prevents text field from being edited
    func textFieldShouldBeginEditing(_ textField: UITextField) -> Bool {
        if(textField == expirationTimeTextField){
            textField.inputView = datePicker
//            self.expirationTimePicker.isHidden = true;
//            UIView.animate(withDuration: 0.25) { () -> Void in
//                self.expirationTimePicker.isHidden = !self.expirationTimePicker.isHidden;
//            }
//            return false;
        }
        return true;
    }
    
//    func textFieldDidBeginEditing(_ textField: UITextField) {
//        animateViewMoving(up: true, moveValue: 100)
//    }
//    
//    func textFieldDidEndEditing(_ textField: UITextField) {
//        animateViewMoving(up: false, moveValue: 100)
//    }
//    
//    // Lifting the view up
//    func animateViewMoving (up:Bool, moveValue :CGFloat){
//        let movementDuration:TimeInterval = 0.3
//        let movement:CGFloat = ( up ? -moveValue : moveValue)
//        UIView.beginAnimations( "animateView", context: nil)
//        UIView.setAnimationBeginsFromCurrentState(true)
//        UIView.setAnimationDuration(movementDuration )
//        self.view.frame = self.view.frame.offsetBy(dx: 0,  dy: movement)
//        UIView.commitAnimations()
//    }
    
    //changes textfield whenever new value in picker is chosen
    func expirationTimePickerChanged(datePicker: UIDatePicker){
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = DateFormatter.Style.short
        dateFormatter.timeStyle = DateFormatter.Style.short
        let strDate = dateFormatter.string(from: datePicker.date)
        expirationTime = datePicker.date.timeIntervalSince1970;
        expirationTimeTextField.text = strDate
    }
    
    func locationSelected(location: [String : Double]) {
        selectedLocation = location;
        //convert latitude and longitude of location into a string and display in textField
        let string = "{ " + String(describing: location["latitude"]!.roundTo(places: 3)) + ", " + String(describing: location["longitude"]!.roundTo(places: 3)) + "}";
        locationTextField.text = string;
    }
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.endEditing(true)
        return true;
    }
    
    func textFieldDidBeginEditing(_ textField: UITextField){
        activeField = textField
    }
    
    func textFieldDidEndEditing(_ textField: UITextField){
        activeField = nil
    }
    
//    func textViewDidBeginEditing(_ textView: UITextView) {
//        if(textView.text == "Please Enter a Description"){
//            textView.text = nil;
//        }
//        textView.textColor = UIColor.black;
//    }
//    
//    func textViewDidChange(_ textView: UITextView) {
//        if(textView.text == "" || textView.text == nil){
//            textView.textColor = placeHolderColor;
//            textView.text = placeHolderText;
//        }
//    }
    
    func textViewDidChange(_ textView: UITextView) {
        placeHolderLabel.isHidden = !textView.text.isEmpty
    }
    
    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
        if(text == "\n")
        {
            view.endEditing(true)
            return false
        }
        return true;
    }
    
//    func textViewShouldEndEditing(_ textView: UITextView) -> Bool {
//        textView.endEditing(true);
//        return false;
//    }
//    
}
