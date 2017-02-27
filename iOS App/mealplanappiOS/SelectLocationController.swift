//
//  SelectLocationController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/11/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import Foundation
import UIKit
import MapKit
import CoreLocation

protocol SelectLocationDelegate {
    func locationSelected(location: [String: Double]);
}

class SelectLocationController: UIViewController, MKMapViewDelegate, CLLocationManagerDelegate{
    
    
    @IBOutlet weak var cancelButton: UIButton!
    
    @IBOutlet weak var selectButton: UIButton!

    @IBOutlet weak var mapView: MKMapView!
    
    var selectedLocation: Location?
    
    var locationManager = CLLocationManager()
    
    var userLocationAnnotation = MKPointAnnotation();
    
    var hasGottenLocation = false;
    
    var delegate:SelectLocationDelegate?;
    
    
    override func viewDidLoad() {
        cancelButton.addTarget(self, action: #selector(cancelButtonClicked(button:)), for: .touchUpInside)
        selectButton.addTarget(self, action: #selector(selectButtonClicked(button:)), for: .touchUpInside)
        
        locationManager.requestWhenInUseAuthorization()
        
        if CLLocationManager.locationServicesEnabled() {
            locationManager.delegate = self
            locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
            locationManager.startUpdatingLocation()
        }
        
        if(self.selectedLocation != nil){
            userLocationAnnotation.coordinate = CLLocationCoordinate2D(latitude: (selectedLocation?.latitude)!, longitude: (selectedLocation?.longitude)!);
            mapView.addAnnotation(userLocationAnnotation);
        }
        mapView.showsUserLocation = true
        
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(false)
        initReconnectTimer();
    }
    
    func setLocation(location: Location){
        self.selectedLocation = location;
    }
    
    
    func cancelButtonClicked(button: UIButton){
        self.dismiss(animated: true, completion: nil)
    }
    
    func selectButtonClicked(button:UIButton){
        let center = mapView.centerCoordinate;
        selectedLocation = Location(dictionary: ["latitude": center.latitude, "longitude": center.longitude]);
        delegate?.locationSelected(location: ["latitude": center.latitude, "longitude": center.longitude]);
        self.dismiss(animated: true, completion: nil)

//        used to test where the center is
//        var annotation = MKPointAnnotation();
//        annotation.coordinate = center;
//        mapView.addAnnotation(annotation);
    }
    
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let location = locations.last! as CLLocation
        let center = CLLocationCoordinate2D(latitude: location.coordinate.latitude, longitude: location.coordinate.longitude)
        if(!hasGottenLocation){
             let region = MKCoordinateRegion(center: center, span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01))
            self.mapView.setRegion(region, animated: false)
            hasGottenLocation = true;
        }
    }
}
    
//    func locationManager(manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
//        let locValue:CLLocationCoordinate2D = manager.location.coordinate
//        print("locations = \(locValue.latitude) \(locValue.longitude)")
//    }
