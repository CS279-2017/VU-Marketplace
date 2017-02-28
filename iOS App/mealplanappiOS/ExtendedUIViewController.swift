//
//  ExtendedUIViewController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/22/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class ExtendedUIViewController: UIViewController{
    override func viewWillAppear(_ animated: Bool) {
        initReconnectTimer();
    }
}
