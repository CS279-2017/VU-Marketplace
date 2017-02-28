//
//  MainController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/9/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//


import Foundation
import UIKit
import CoreLocation

//MainController is the entry point of the app
//the main controller selects whether the user wants to login or register
//upon entering the main controller, will check if there are valid user credentials stored
//if so then attempt to login
//otherwise show the main screen

//extension UITableViewCell {
//    func hideKeyboardWhenTappedAround() {
//        let tap: UITapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(UIViewController.dismissKeyboard))
//        tap.cancelsTouchesInView = false;
//        contentView.addGestureRecognizer(tap)
//    }
//    
//    func dismissKeyboard() {
//        contentView.endEditing(true)
//    }
//
//}
extension UIViewController {
    func hideKeyboardWhenTappedAround() {
        let tap: UITapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(UIViewController.dismissKeyboard))
        tap.cancelsTouchesInView = false;
        view.addGestureRecognizer(tap)
    }
    
    func dismissKeyboard() {
        view.endEditing(true)
    }
    
    func showActivityIndicator() {
        if(self.view.viewWithTag(100) != nil){
            self.view.viewWithTag(100)?.isHidden = false;
        }
        else{
            let container: UIView = UIView()
            container.frame = self.view.frame
            container.center = self.view.center
            container.backgroundColor = UIColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.3)
            container.layer.zPosition = 10;
            
            let loadingView: UIView = UIView()
            
            loadingView.frame = CGRect(x: 0, y: 0, width: 80, height: 80)
            loadingView.center = self.view.center
            loadingView.backgroundColor = UIColor(colorLiteralRed: (4*16 + 4)/255, green: (4*16 + 4)/256, blue: (4*16 + 4)/256, alpha: 0.7)
            loadingView.clipsToBounds = true
            loadingView.layer.cornerRadius = 10
            
            let actInd: UIActivityIndicatorView = UIActivityIndicatorView()
            actInd.frame = CGRect(x: 0, y: 0, width: 40, height: 40)
            actInd.activityIndicatorViewStyle =
                UIActivityIndicatorViewStyle.whiteLarge
            actInd.center = CGPoint(x: loadingView.frame.size.width / 2, y: loadingView.frame.size.height / 2)
            loadingView.addSubview(actInd)
            container.addSubview(loadingView)
            container.tag = 100;
            self.view.addSubview(container)
            actInd.startAnimating()
            let when = DispatchTime.now() + 10
            DispatchQueue.main.asyncAfter(deadline: when) {
                // Your code with delay
                self.hideActivityIndicator();
            }
            
        }
        
    }
    
    func timeOut(){
        DataStore.get().error_handler(error: "Request has timed out");
        hideActivityIndicator();
    }
    
    func hideActivityIndicator(){
        if(self.view.viewWithTag(100) != nil){
            self.view.viewWithTag(100)?.isHidden = true;
        }
    }
    
    func showProgressBar(msg:String, _ indicator:Bool, width: CGFloat) {
        if(self.view.viewWithTag(200) != nil){
            self.view.viewWithTag(200)?.isHidden = false;
        }
        else{
            var messageFrame = UIView()
            var activityIndicator = UIActivityIndicatorView()
            var strLabel = UILabel()
            strLabel.layer.zPosition = 9;
            messageFrame.layer.zPosition = 9;
            activityIndicator.layer.zPosition = 9;

            
            strLabel = UILabel(frame: CGRect(x: 50, y: 0, width: 200, height: 50))
            strLabel.text = msg
            strLabel.textColor = UIColor.white
            messageFrame = UIView(frame: CGRect(x: view.frame.midX - width/2, y: view.frame.midY - 25 , width: width, height: 50))
            messageFrame.layer.cornerRadius = 15
            messageFrame.backgroundColor = UIColor(white: 0, alpha: 0.7)
            if indicator {
                activityIndicator = UIActivityIndicatorView(activityIndicatorStyle: UIActivityIndicatorViewStyle.white)
                activityIndicator.frame = CGRect(x: 0, y: 0, width: 50, height: 50)
                activityIndicator.startAnimating()
                messageFrame.addSubview(activityIndicator)
            }
            messageFrame.addSubview(strLabel)
            messageFrame.tag = 200;
            self.view.addSubview(messageFrame)
        }
    }
    
    func hideProgressBar(){
        if(self.view.viewWithTag(200) != nil){
            self.view.viewWithTag(200)?.isHidden = true;
        }
    }
    
    func isNonLoginController() -> Bool{
        let controller = self;
        if(controller is RegisterEmailController || controller is RegisterUserDataController || controller is RegisterVerificationCodeController || controller is LoginController){
            return false;
        }
        else{
            return true;
        }
    }
    
    func isMainController() -> Bool{
        let controller = self;
        if(controller is RegisterEmailController || controller is RegisterUserDataController || controller is RegisterVerificationCodeController || controller is LoginController){
            return false;
        }
        else{
            return true;
        }
    }
}

class MainController: UITabBarController, CLLocationManagerDelegate, UITabBarControllerDelegate{
    
    @IBOutlet weak var myTabBar: UITabBar!
    
    var listingTabNotifications = 0; //index 0
    var transactionTabNotifications = 0; //index 1
    var settingsNotifications = 0; //index 2
    var locationManager = CLLocationManager();
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.delegate = self;
        
//        myTabBar.delegate = self;
        DataStore.get().addControllerWithIdentifier(identifier: "MainController", controller: self)
        self.hideKeyboardWhenTappedAround()
        // Ask for Authorisation from the User.
        locationManager.requestAlwaysAuthorization()
        // For use in foreground
//        locationManager.requestWhenInUseAuthorization()
        
        if CLLocationManager.locationServicesEnabled() {
            locationManager.delegate = self
            locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
            locationManager.startUpdatingLocation()
        }
        
//        myTabBar.items![0].title = "Listings";
//        myTabBar.items![0].image = #imageLiteral(resourceName: "listings_icon")
//        myTabBar.items![1].title = "Transactions";
//        myTabBar.items![1].image = #imageLiteral(resourceName: "transactions_icon");
//        myTabBar.items![2].title = "Settings";
//        myTabBar.items![2].image = #imageLiteral(resourceName: "settings_icon");
        
        //attempts to preload all the view controllers in tabBar so that event handlers will be loaded
        for controller in viewControllers! {
            let _ = controller.view
        }
                
//        func transactionRequestMadeListener(data: Any){
//            let data = data as! Dictionary<String, Any>
//            print("transactionRequestMadeListener triggered in MainController")
//            //transaction object passed back to used in creating a client side Transaction object
//            let transaction_json = data["transaction"] as! Dictionary<String, Any>;
//            
//            let topViewController = UIApplication.topViewController()
//            if((topViewController is TransactionController2) && (topViewController as! TransactionController2).segmentedControl.selectedSegmentIndex == 0){
//                //do nothing
//            }
//            else if(myTabBar.items![1].badgeValue != nil){
//                transactionTabNotifications += 1;
//                myTabBar.items![1].badgeValue = String(transactionTabNotifications);
//            }
//            else{
//                transactionTabNotifications = 0;
//                transactionTabNotifications += 1;
//                myTabBar.items![1].badgeValue = String(transactionTabNotifications);
//            }
//            
//        }
        
        //TODO: add a badge to tab bar to indicate a new transaction has arrived
        
//        DataStore.get().addListener(listener: transactionRequestMadeListener, forEvent: "transaction_request_made", key: "MainController");
//        
//        func transactionRequestDeclinedListener(data: Any){
//            let data = data as! Dictionary<String, Any>
//            print("transactionRequestDeclinedListener triggered in MainController")
//            //transaction object passed back to used in creating a client side Transaction object
//            let transaction_id = data["transaction_id"] as! String;
//            //            let listing_id = data["listing_id"] as! Any;
//            
//            if(myTabBar.items![1].badgeValue != nil){
//                transactionTabNotifications -= 1;
//                if(transactionTabNotifications != 0){
//                    myTabBar.items![1].badgeValue = String(transactionTabNotifications);
//                }
//                else{
//                    myTabBar.items![1].badgeValue = nil;
//                }
//            }
//            else{
//                transactionTabNotifications = 0;
//            }
//            
//        }
        
        //TODO: add a badge to tab bar to indicate a new transaction has arrived
        
//        DataStore.get().addListener(listener: transactionRequestDeclinedListener, forEvent: "transaction_request_declined", key: "MainController");
        
//        func transactionConfirmedListener(data: Any){
//            let data = data as! Dictionary<String, Any>
//            print("transactionRequestMadeListener triggered in MainController")
//            //transaction object passed back to used in creating a client side Transaction object
//            let transaction_json = data["transaction"] as! Dictionary<String, Any>;
//            
//            let topViewController = UIApplication.topViewController()
//            if((topViewController is TransactionController2) && (topViewController as! TransactionController2).segmentedControl.selectedSegmentIndex == 1){
//                //do nothing
//            }
//            else if(myTabBar.items![1].badgeValue != nil){
//                transactionTabNotifications += 1;
//                myTabBar.items![1].badgeValue = String(transactionTabNotifications);
//            }
//            else{
//                transactionTabNotifications = 0;
//                transactionTabNotifications += 1;
//                myTabBar.items![1].badgeValue = String(transactionTabNotifications);
//            }
//            
//        }
//        
        //TODO: add a badge to tab bar to indicate a new transaction has arrived
        
//        DataStore.get().addListener(listener: transactionConfirmedListener, forEvent: "transaction_confirmed", key: "MainController");
        
//        func transactionCompletedListener(data: Any){
//            let data = data as! Dictionary<String, Any>
//            print("transactionRequestMadeListener triggered in MainController")
//            //transaction object passed back to used in creating a client side Transaction object
//            let transaction_json = data["transaction"] as! Dictionary<String, Any>;
//            
//            let topViewController = UIApplication.topViewController()
//            if((topViewController is TransactionController2) && (topViewController as! TransactionController2).segmentedControl.selectedSegmentIndex == 3){
//                //do nothing
//            }
//            else if(myTabBar.items![1].badgeValue != nil){
//                transactionTabNotifications += 1;
//                myTabBar.items![1].badgeValue = String(transactionTabNotifications);
//            }
//            else{
//                transactionTabNotifications = 0;
//                transactionTabNotifications += 1;
//                myTabBar.items![1].badgeValue = String(transactionTabNotifications);
//            }
//            
//        }
//        
//        //TODO: add a badge to tab bar to indicate a new transaction has arrived
//        
//        DataStore.get().addListener(listener: transactionCompletedListener, forEvent: "transaction_completed", key: "MainController");
        
//        sendLocalNotification(body: "Hi");
        
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if(UserData.get() != nil && DataStore.get().socket_connected){
            if let user_id = UserData.get()?.user_id{
                if let password = UserData.get()?.password{
                    func callback(dictionary: Dictionary<String, Any>){
                        let location = Location(dictionary: dictionary);
                        UserData.get()?.location = location;
                        print("updateUserLocation successful!")
                    }
                    func error_handler(error: String){
                        print("updateUserLocation failed!")
                        print(error);
                    }
                    let locValue:CLLocationCoordinate2D = manager.location!.coordinate
//                    DataStore.get().updateUserLocation(user_id: user_id, password: password, new_location: ["latitude": locValue.latitude
//                        , "longitude": locValue.longitude], callback: callback , error_handler: error_handler)
//                    print("locations = \(locValue.latitude) \(locValue.longitude)")

                }
            };
        }
    }
    
//    override func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
//        
//    }
    
    func tabBarController(_ tabBarController: UITabBarController, shouldSelect viewController: UIViewController) -> Bool {
        if(viewController is MakeListingController3){
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            let controller = storyboard.instantiateViewController(withIdentifier: "MakeListingController3") as! MakeListingController3
            self.present(controller, animated: false, completion: nil)
            return false;
        }
        return true
    }
}
