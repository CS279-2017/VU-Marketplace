//
//  RequestTransactionCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/15/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class RequestTransactionCell: UITableViewCell{
    
    @IBOutlet weak var requestTransactionButton: UIButton!
    override func awakeFromNib() {
        requestTransactionButton.addTarget(self, action: #selector(requestTransactionButtonClicked), for: .touchUpInside)
    }
    
    func requestTransactionButtonClicked(){
//        DataStore.get().
        
    }
}
