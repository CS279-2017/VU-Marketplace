//
//  LabelCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/1/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class LabelCell: UITableViewCell{
    
    @IBOutlet weak var label: UILabel!
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    func setLabel(text: String){
        self.label.text = text;
    }
}
