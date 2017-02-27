//
//  UserAnnotation.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/8/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
////
//
import UIKit
import MapKit

class UserAnnotation: NSObject, MKAnnotation {
    var first_name: String
    var last_name: String
    var profile_picture: UIImage;
    var coordinate: CLLocationCoordinate2D

    init(first_name: String, last_name: String, profile_picture: UIImage, coordinate: CLLocationCoordinate2D) {
        self.first_name = first_name
        self.last_name = last_name
        self.profile_picture = profile_picture
        self.coordinate = coordinate
    }
}
