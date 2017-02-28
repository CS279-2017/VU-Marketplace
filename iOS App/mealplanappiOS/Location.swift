//
//  Location.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/22/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//
import Foundation
import CoreLocation

class Location{
    var latitude: Double?;
    var longitude:Double?;
    var last_update_time: UInt64?
    
    init(latitude: Double, longitude: Double, last_update_time: UInt64?){
        self.latitude = latitude
        self.longitude = longitude
        self.last_update_time = last_update_time;
    }
    init(dictionary: Dictionary<String, Any>){
        self.latitude = dictionary["latitude"] as? Double;
        self.longitude = dictionary["longitude"] as? Double;
        if(dictionary["last_update_time"] != nil){
            self.last_update_time = UInt64((dictionary["last_update_time"] as! NSNumber).doubleValue)
        }
    }
    
    func midpoint(location: Location) -> Location{
        let latitude_midpoint = (self.latitude! + location.latitude!) / 2;
        let longitude_midpoint = (self.longitude! + location.longitude!)/2;
        return Location(latitude: latitude_midpoint, longitude: longitude_midpoint, last_update_time: UInt64(Date().timeIntervalSince1970 * 1000))
    }
    
    func coordinates() -> CLLocationCoordinate2D{
        return CLLocationCoordinate2D(latitude: self.latitude!, longitude: self.longitude!);
    }
    
    func location() -> CLLocation{
        return CLLocation(latitude: self.latitude!, longitude: self.longitude!)
    }
}
