//
//  RegistrationSuccessController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/10/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import Foundation
import UIKit

class RegistrationSuccessController: UIViewController{
    @IBOutlet weak var label: UILabel!
    
    @IBOutlet weak var loginButton: UIButton!
    
    var first_name:String? 
    override func viewDidLoad() {
        self.hideKeyboardWhenTappedAround()

        label.lineBreakMode = .byWordWrapping
        label.numberOfLines = 0
        label.text = "Congratulations " + first_name! + " you've successfully registered!";
    }
}
