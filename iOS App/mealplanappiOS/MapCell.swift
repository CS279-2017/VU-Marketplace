//
//  MapCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/29/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit
import MapKit

class MapCell: UITableViewCell, MKMapViewDelegate{
    
    var listing: Listing?
    
    var transaction: Transaction?
    
    var locationAnnotation = MKPointAnnotation();

    var buyerAnnotation = MKPointAnnotation();
    var isBuyerAnnotationAdded = false;
    
    var mapType:String? = nil;
    
    var sellerAnnotation = MKPointAnnotation();
    var isSellerAnnotationAdded = false;
    
    @IBOutlet weak var mapView: MKMapView!
    
    override init(style: UITableViewCellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier);
    }
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
//    Can only call either setListing or setTransaction, calling either of these will make the MapCell a MapCell of that type;
    
    func setLocation(location: Location?){
        if(location != nil){
            locationAnnotation.coordinate = (location?.coordinates())!;
            mapView.addAnnotation(locationAnnotation)
            mapView.showAnnotations([locationAnnotation], animated: false);
        }
        func userLocationUpdatedListener(dictionary: Any){
            if(self.mapType == nil){
                self.mapView.showsUserLocation = true;
                let dictionary = dictionary as! Dictionary<String, Any>
                let updated_location = Location(dictionary: dictionary["updated_location"] as! Dictionary<String, Any>)
                
                let center = updated_location.coordinates();
                let region = MKCoordinateRegion(center: center, span: MKCoordinateSpan(latitudeDelta: 0.005, longitudeDelta: 0.005))
                self.mapView.setCenter(center, animated: false);
                self.mapView.setRegion(region, animated: false);
                
                let user_coordinate = updated_location.coordinates();
                let userLocationAnnotation = MKPointAnnotation();
                userLocationAnnotation.coordinate = user_coordinate;
                mapView.addAnnotation(userLocationAnnotation);
                if(location != nil){
                    mapView.showAnnotations([userLocationAnnotation, locationAnnotation], animated: false)
                }
                else{
                    mapView.showAnnotations([userLocationAnnotation], animated: false)

                }
                mapView.removeAnnotation(userLocationAnnotation);
            }
        }
        DataStore.get().addListenerOnce(listener: userLocationUpdatedListener, forEvent: "update_user_location_response");
    }
    
    func setListing(listing: Listing?) {
        self.listing = listing;
        if(listing != nil){
            if(self.mapType == nil){
                let center = listing?.location
                let region = MKCoordinateRegion(center: (center?.coordinates())!, span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01))
                self.mapView.setRegion(region, animated: true)
                self.mapView.setCenter((center?.coordinates())!, animated: false);
                locationAnnotation.coordinate = (listing?.location?.coordinates())!;
                mapView.addAnnotation(locationAnnotation);
                mapView.showsUserLocation = true
                
            }
            else{
                print("Already set MapCell to type " + self.mapType!);
            }
            
            func userLocationUpdatedListener(dictionary: Any){
                let dictionary = dictionary as! Dictionary<String, Any>
                let updated_location = Location(dictionary: dictionary["updated_location"] as! Dictionary<String, Any>)
                
                //hack that temporarily adds an annotation in order to set the region of the mapview and then removes it (annotation is never rendered)
                let user_coordinate = updated_location.coordinates();
                let userLocationAnnotation = MKPointAnnotation();
                userLocationAnnotation.coordinate = user_coordinate;
                mapView.addAnnotation(userLocationAnnotation);
                mapView.showAnnotations([userLocationAnnotation, locationAnnotation], animated: true)
                mapView.removeAnnotation(userLocationAnnotation);
            }
            DataStore.get().addListenerOnce(listener: userLocationUpdatedListener, forEvent: "update_user_location_response");
        }
    }
    
    func setTransaction(transaction: Transaction?){
        self.transaction = transaction;
        mapView.delegate = self;

        if(transaction != nil){
            func updateUserAnnotation(user_id: String, updated_location : Location){
                if(user_id == transaction?.getOtherUserId()){
                    let currentLocationAnnotation = MKPointAnnotation();
                    let currentUserLocation = UserData.get()?.location;
                    if(currentUserLocation != nil){
                        currentLocationAnnotation.coordinate = (currentUserLocation?.coordinates())!;
                        mapView.addAnnotation(currentLocationAnnotation);
                    }
                    
                    if(user_id == transaction?.buyer_user_id){
                        buyerAnnotation.coordinate = (updated_location.coordinates());
                        if let buyer = DataStore.get().getUserInfo(user_id: (transaction?.buyer_user_id)!){
                            buyerAnnotation.title = buyer.first_name! + " " + buyer.last_name!
                        }
                        
                        if(!isBuyerAnnotationAdded){
                            mapView.addAnnotation(buyerAnnotation);
                            isBuyerAnnotationAdded = true;
                            
                            if(isBuyerAnnotationAdded && isSellerAnnotationAdded){
                                if(currentUserLocation != nil){
                                    mapView.showAnnotations([currentLocationAnnotation, buyerAnnotation, sellerAnnotation, locationAnnotation], animated: true)
                                }
                                else{
                                    mapView.showAnnotations([buyerAnnotation, sellerAnnotation, locationAnnotation], animated: true)
                                }
                            }
                            else{
                                if(currentUserLocation != nil){
                                    mapView.showAnnotations([currentLocationAnnotation, buyerAnnotation, locationAnnotation], animated: true)
                                }
                                else{
                                    mapView.showAnnotations([buyerAnnotation, locationAnnotation], animated: true)
                                }
                                
                            }
                        }
                        
                    }
                    else if(user_id == transaction?.seller_user_id){
                        sellerAnnotation.coordinate = (updated_location.coordinates());
                        if let seller = DataStore.get().getUserInfo(user_id: (transaction?.seller_user_id)!){
                            sellerAnnotation.title = seller.first_name! + " " + seller.last_name!
                        }
                        if(!isSellerAnnotationAdded){
                            mapView.addAnnotation(sellerAnnotation);
                            isSellerAnnotationAdded = true;
                            
                            if(isBuyerAnnotationAdded && isSellerAnnotationAdded){
                                if(currentUserLocation != nil){
                                    mapView.showAnnotations([currentLocationAnnotation, buyerAnnotation, sellerAnnotation, locationAnnotation], animated: true)
                                }
                                else{
                                    mapView.showAnnotations([buyerAnnotation, sellerAnnotation, locationAnnotation], animated: true)
                                }
                            }
                            else{
                                if(currentUserLocation != nil){
                                    mapView.showAnnotations([currentLocationAnnotation, sellerAnnotation, locationAnnotation], animated: true)
                                }
                                else{
                                    mapView.showAnnotations([sellerAnnotation, locationAnnotation], animated: true)
                                }
                                
                            }
                        }
                    }
                    mapView.removeAnnotation(currentLocationAnnotation);
                }
            }
            
            if(mapType == nil){
                mapType = "Transaction";
                let center = transaction?.location
                let region = MKCoordinateRegion(center: (center?.coordinates())!, span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01))
                self.mapView.setRegion(region, animated: true)
                self.mapView.setCenter((center?.coordinates())!, animated: false)
                locationAnnotation.coordinate = (transaction?.location?.coordinates())!;
                locationAnnotation.title = "Meet Up Location";
                mapView.addAnnotation(locationAnnotation);
                
                var currentLocationAnnotation = MKPointAnnotation();
                let currentUserLocation = UserData.get()?.location;
                if let other_user_location = DataStore.get().getUserInfo(user_id: (transaction?.getOtherUserId())!)?.location{
                    updateUserAnnotation(user_id: (transaction?.getOtherUserId())!, updated_location: other_user_location)
                }
                
                mapView.removeAnnotation(currentLocationAnnotation);
                mapView.showsUserLocation = true
                
            }
            else{
                print("Already set MapCell to type " + self.mapType!);
            }
            
            func userLocationUpdatedListener(dictionary: Any){
                
                let dictionary = dictionary as! Dictionary<String, Any>
                let user_id = dictionary["user_id"] as! String
//                let transaction_id = dictionary["transaction_id"] as! String;
                let updated_location = Location(dictionary: dictionary["updated_location"] as! Dictionary<String, Any>)
                
                updateUserAnnotation(user_id: user_id, updated_location: updated_location)
                
                mapView.reloadInputViews();
                
            }
            
            DataStore.get().addListener(listener: userLocationUpdatedListener, forEvent: "user_location_updated", key: "MapCell");
        }
    }
    
    func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
        // Don't want to show a custom image if the annotation is the user's location.
        guard !(annotation is MKUserLocation) else {
            return nil
        }
        
//        guard !(annotation as! MKPointAnnotation == locationAnnotation) else{
//            return nil;
//        }
//
        // Better to make this class property
        let annotationIdentifier = "AnnotationIdentifier"
        
        var annotationView: MKAnnotationView?
        if let dequeuedAnnotationView = mapView.dequeueReusableAnnotationView(withIdentifier: annotationIdentifier) {
            annotationView = dequeuedAnnotationView
            annotationView?.annotation = annotation
        }
        else {
            annotationView = MKAnnotationView(annotation: annotation, reuseIdentifier: annotationIdentifier)
//            annotationView?.rightCalloutAccessoryView = UIButton(type: .detailDisclosure)
        }
        
        if let annotationView = annotationView {
            // Configure your annotation view here
            annotationView.canShowCallout = true
            var pinImage: UIImage?
            if(annotation as! MKPointAnnotation == buyerAnnotation){
                pinImage = DataStore.get().getUserProfilePicture(user_id: (transaction?.buyer_user_id)!)?.circle!
            }
            else if(annotation as! MKPointAnnotation == sellerAnnotation){
                pinImage = DataStore.get().getUserProfilePicture(user_id: (transaction?.seller_user_id)!)?.circle!

            }
            else{
                return nil;
            }
//            let size = CGSize(width: 25, height: 25)
//            UIGraphicsBeginImageContext(size)
//            if let pinImage = pinImage{
//                pinImage.draw(in: CGRect(x: 0, y: 0, width: size.width, height: size.height));
//            }
            if pinImage != nil{
                pinImage = pinImage!.resizeWith(width: 25)
                annotationView.image = pinImage;
            }
//            pinImage!.resizeWith(width: 50);
//            let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
//            UIGraphicsEndImageContext()
//            annotationView.image = pinImage;
        }
        
        return annotationView
    }
}
