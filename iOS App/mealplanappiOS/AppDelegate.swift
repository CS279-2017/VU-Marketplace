//
//  AppDelegate.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/8/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?


    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
       
//        UITableView.appearance().backgroundColor =  UITableViewHeaderFooterView.appearance().backgroundColor;
       
        
        DataStore.get(); // initializes DataStore
        
//        UINavigationBar.appearance().barTintColor = DataStore.get().elephantDarkGray;
////        UINavigationBar.appearance().tint = DataStore.get().elephantDarkGray
////        UINavigationBar.appearance().alpha = 1.0;
////        UITabBar.appearance().backgroundColor = DataStore.get().elephantDarkGray;
//        UITabBar.appearance().tintColor = UIColor.white;
//        UITabBar.appearance().barTintColor = DataStore.get().elephantDarkGray;
////        UITabBar
        
//        UITableView.appearance().backgroundColor = UIColor.lightText;
        
        
        
//        UIView.appearance().backgroundColor = DataStore.get().elephantGray;
                
        
        func profilePictureGottenListener(data: Any){
            print("profile_picture_gotten handler called");
            let data = data as! Dictionary<String, Any>
            let user_id = data["user_id"] as! String;
            let profile_picture = data["profile_picture"] as! Data
            print("getProfilePicture successful!");
            DataStore.get().setUserProfilePicture(user_id: user_id, profile_picture: UIImage(data: profile_picture)!);            
        }
        DataStore.get().addListener(listener: profilePictureGottenListener, forEvent: "get_profile_picture_response", key: "AppDelegate");
        
       
        if #available(iOS 10.0, *) {
            let center = UNUserNotificationCenter.current()
            center.requestAuthorization(options:[.badge, .alert, .sound]) { (granted, error) in
                // Enable or disable features based on authorization.
            }
            application.registerForRemoteNotifications()
            center.delegate = self;
        
            let acceptAction = UNNotificationAction(identifier: "TRANSACTION_REQUEST_ACCEPT",
                                                    title: "Accept",
                                                    options: UNNotificationActionOptions(rawValue: 0))
            let declineAction = UNNotificationAction(identifier: "TRANSACTION_REQUEST_DECLINE",
                                                  title: "Decline",
                                                  options: UNNotificationActionOptions(rawValue: 0))
            
            let transactionRequestMadeCategory = UNNotificationCategory(identifier: "TRANSACTION_REQUEST_MADE",
                                                                        actions: [acceptAction, declineAction],
                                                                        intentIdentifiers: [],
                                                                        options: UNNotificationCategoryOptions(rawValue: 0))
            
            let transactionStartedCategory = UNNotificationCategory(identifier: "TRANSACTION_STARTED",
                                                                        actions: [],
                                                                        intentIdentifiers: [],
                                                                        options: UNNotificationCategoryOptions(rawValue: 0))
            
            center.setNotificationCategories([transactionRequestMadeCategory])

        } else {
            // Fallback on earlier versions
            UIApplication.shared.registerUserNotificationSettings(UIUserNotificationSettings(types: [.badge, .sound, .alert], categories: nil))
            UIApplication.shared.registerForRemoteNotifications()
            
        }
        
//        addNotificationSendingListeners();
        if #available(iOS 10.0, *) {
            UNUserNotificationCenter.current().getNotificationSettings(completionHandler: { (settings: UNNotificationSettings) in
                if(!(settings.authorizationStatus == .authorized)){
                    if(UserData.get()?.device_token == nil){
                        UserData.set(device_token: DataStore.get().randomString(length: 32));
                    }
                }
                
            })
        } else {
            if(!((UIApplication.shared.currentUserNotificationSettings?.types.contains(UIUserNotificationType.alert))!)){
                if(UserData.get()?.device_token == nil){
                    UserData.set(device_token: DataStore.get().randomString(length: 32));
                };
            }

        }
        
        return true


    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        DataStore.get().socket.disconnect();
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        DataStore.get().socket.connect();
    }
    
    @available(iOS 10.0, *)
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if #available(iOS 10.0, *) {
            completionHandler(UNNotificationPresentationOptions.alert)
        } else {
            // Fallback on earlier versions
        }
    }
    
    @available(iOS 10.0, *)
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        let notification_category = response.notification.request.content.categoryIdentifier
    }
    
    // Handle remote notification registration.
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data){
        // Convert token to string
        let deviceTokenString = deviceToken.reduce("", {$0 + String(format: "%02X", $1)})
        UserData.set(device_token: deviceTokenString);
        // Print it to console
        print("APNs device token: \(deviceTokenString)")
    }
    
    
    // Called when APNs failed to register the device for push notifications
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        // Print the error to console (you should alert the user that registration failed)
        print("APNs registration failed: \(error)")
    }
    
    // Push notification received
    func application(_ application: UIApplication, didReceiveRemoteNotification data: [AnyHashable : Any]) {
        // Print notification payload data
        print("Push notification received: \(data)")
    }


}

extension UIImage {
    var rounded: UIImage? {
        let imageView = UIImageView(image: self)
        imageView.layer.cornerRadius = min(size.height/4, size.width/4)
        imageView.layer.masksToBounds = true
        UIGraphicsBeginImageContextWithOptions(imageView.bounds.size, false, scale)
        guard let context = UIGraphicsGetCurrentContext() else { return nil }
        imageView.layer.render(in: context)
        let result = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return result
    }
    var circle: UIImage? {
        let square = CGSize(width: min(size.width, size.height), height: min(size.width, size.height))
        let imageView = UIImageView(frame: CGRect(origin: .zero, size: square))
        imageView.contentMode = .scaleAspectFill
        imageView.image = self
        imageView.layer.cornerRadius = square.width/2
        imageView.layer.masksToBounds = true
        UIGraphicsBeginImageContextWithOptions(imageView.bounds.size, false, scale)
        guard let context = UIGraphicsGetCurrentContext() else { return nil }
        imageView.layer.render(in: context)
        let result = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return result
    }
}

extension UIImage {
    func resizeWith(percentage: CGFloat) -> UIImage? {
        let imageView = UIImageView(frame: CGRect(origin: .zero, size: CGSize(width: size.width * percentage, height: size.height * percentage)))
        imageView.contentMode = .scaleAspectFit
        imageView.image = self
        UIGraphicsBeginImageContextWithOptions(imageView.bounds.size, false, scale)
        guard let context = UIGraphicsGetCurrentContext() else { return nil }
        imageView.layer.render(in: context)
        guard let result = UIGraphicsGetImageFromCurrentImageContext() else { return nil }
        UIGraphicsEndImageContext()
        return result
    }
    func resizeWith(width: CGFloat) -> UIImage? {
        let imageView = UIImageView(frame: CGRect(origin: .zero, size: CGSize(width: width, height: CGFloat(ceil(width/size.width * size.height)))))
        imageView.contentMode = .scaleAspectFit
        imageView.image = self
        UIGraphicsBeginImageContextWithOptions(imageView.bounds.size, false, scale)
        guard let context = UIGraphicsGetCurrentContext() else { return nil }
        imageView.layer.render(in: context)
        guard let result = UIGraphicsGetImageFromCurrentImageContext() else { return nil }
        UIGraphicsEndImageContext()
        return result
    }
}

extension UIImage {
    
    func scaleImage(toSize newSize: CGSize) -> UIImage? {
        let newRect = CGRect(x: 0, y: 0, width: newSize.width, height: newSize.height).integral
        UIGraphicsBeginImageContextWithOptions(newSize, false, 0)
        if let context = UIGraphicsGetCurrentContext() {
            context.interpolationQuality = .high
            let flipVertical = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: 0, ty: newSize.height)
            context.concatenate(flipVertical)
            context.draw(self.cgImage!, in: newRect)
            let newImage = UIImage(cgImage: context.makeImage()!)
            UIGraphicsEndImageContext()
            return newImage
        }
        return nil
    }
}

extension AppDelegate{
    func sendLocalNotification(body: String, categoryIdentifier: String?, userInfo: [AnyHashable:Any]?) {
        let delay_time = 0.25;
        //        if #available(iOS 10.0, *) {
        //            let content = UNMutableNotificationContent()
        ////            content.title = "10 Second Notification Demo"
        ////            content.subtitle = "From MakeAppPie.com"
        //            content.body = body
        //            content.sound = UNNotificationSound.default();
        //            content.categoryIdentifier = categoryIdentifier!;
        //            if let userInfo = userInfo{
        //                content.userInfo = userInfo
        //            }
        //
        //            let trigger = UNTimeIntervalNotificationTrigger(
        //                timeInterval: delay_time,
        //                repeats: false)
        //
        //            let request = UNNotificationRequest(
        //                identifier: "10.second.message",
        //                content: content,
        //                trigger: trigger)
        //            UNUserNotificationCenter.current().add(
        //                request, withCompletionHandler: nil)
        //        } else {
        // Fallback on earlier versions
        let notification = UILocalNotification()
        notification.fireDate = NSDate(timeIntervalSinceNow: delay_time) as Date
        notification.alertBody = body
        notification.category = categoryIdentifier;
        //            notification.alertAction = "be awesome!"
        notification.soundName = UILocalNotificationDefaultSoundName
        notification.userInfo = userInfo;
        UIApplication.shared.scheduleLocalNotification(notification);
        //        }
    }
}

extension Double{
    func toTwoDecimalPlaces() -> String{
        if(self == 0){
            return "FREE"
        }
        return "$" + String(format: "%.2f", self);
    }
}

extension String{
    func toPrice() -> Double?{
        if(self == "FREE"){
            return 0;
        }
        else if let price = Double(self.replacingOccurrences(of: "$", with: "")){
            return price;
        }
        //for invalidate input
        return nil;
    }
}

extension Double {
    /// Rounds the double to decimal places value
    func roundTo(places:Int) -> Double {
        let divisor = pow(10.0, Double(places))
        return (self * divisor).rounded() / divisor
    }
}

extension UInt64{
    
    func secondsToDaysHoursMinutesSecondsToString (seconds:UInt64) -> String{
        var returnString = "";
        
        func secondsToDaysHoursMinutesSeconds (seconds :  UInt64) -> (Int, Int, Int, Int) {
            
            return (Int(seconds / (3600 * 24)) , Int((seconds % (3600 * 24)) / 3600), Int((seconds % 3600) / 60), Int(seconds % 60))
        }
        let (d, h, m, s) = secondsToDaysHoursMinutesSeconds (seconds: seconds)
        if(d != 0){
            returnString += "\(d) d ";
        }
        if(h != 0 || d != 0){
            returnString += "\(h) h ";
        }
        if(m != 0 || h != 0 || d != 0){
            returnString += "\(m) m "
        }
        if(returnString == ""){
            returnString += "\(s) s ";
        }
        //            return ("\(d) days \(h) hours \(m) minutes \(s) seconds");
        return returnString;
    }
    
    
    
    func timeLeft() -> String{
        let current_time = UInt64(Date().timeIntervalSince1970 * 1000);
        if(self < current_time){
            return "Expired"
        }
        else{
            let seconds = (self - current_time)/1000;
            return secondsToDaysHoursMinutesSecondsToString(seconds: seconds);
        }
        
    }
    
    
    
    func timePassed() -> String{
        let current_time = UInt64(Date().timeIntervalSince1970 * 1000)
        if(current_time < self){
            return "Invalid"
        }
        else{
            let seconds =  (current_time - self)/1000
            if(seconds <= 60){
                return "1m ago";
            }
            //        return "";
            return secondsToDaysHoursMinutesSecondsToString(seconds: seconds)
        }
    }
    
    func toDateString() -> String{
        let date = Date(timeIntervalSince1970: TimeInterval(self/1000))
        
        let dayTimePeriodFormatter = DateFormatter()
        dayTimePeriodFormatter.dateFormat = "MMM dd YYYY hh:mm a"
        
        let dateString = dayTimePeriodFormatter.string(from: date)
        return dateString;
    }
}

extension NSMutableAttributedString {
    func bold(text:String) -> NSMutableAttributedString {
        let attrs:[String:AnyObject] = [NSFontAttributeName : UIFont.boldSystemFont(ofSize: 17)]
        let boldString = NSMutableAttributedString(string:"\(text)", attributes:attrs)
        self.append(boldString)
        return self
    }
    
    func normal(text:String)->NSMutableAttributedString {
        let normal =  NSAttributedString(string: text)
        self.append(normal)
        return self
    }
}

extension UITableView {
    func tableViewScrollToBottom(animated: Bool) {
        
        DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(100)) {
            let numberOfSections = self.numberOfSections
            let numberOfRows = self.numberOfRows(inSection: numberOfSections-1)
            if numberOfRows > 0 {
                let indexPath = IndexPath(row: numberOfRows-1, section: (numberOfSections-1))
                self.scrollToRow(at: indexPath, at: UITableViewScrollPosition.bottom, animated: animated)
            }
            let scrollPoint = CGPoint(x: 0, y: self.contentSize.height - self.frame.size.height)
            self.setContentOffset(scrollPoint, animated: true)
            if #available(iOS 10.0, *) {
                if(self.refreshControl != nil){
                    self.refreshControl?.endRefreshing();
                }
            } else {
                // Fallback on earlier versions
            }
            
        }
    }
}

extension UIApplication {
    func topViewController(controller: UIViewController? = UIApplication.shared.keyWindow?.rootViewController) -> UIViewController? {
        if let navigationController = controller as? UINavigationController {
            return topViewController(controller: navigationController.visibleViewController)
        }
        if let tabController = controller as? UITabBarController {
            if let selected = tabController.selectedViewController {
                return topViewController(controller: selected)
            }
        }
        if let presented = controller?.presentedViewController {
            return topViewController(controller: presented)
        }
        return controller
    }
    
    
    func downloadImageSynchronously(url: String) -> UIImage?{
        if let url = URL(string: url){
            do{
                let data = try Data(contentsOf: url);
                if let image = UIImage(data: data){
                    return image;
                }
            }catch{
                return nil;
            }
        }
        return nil;
    }
}


