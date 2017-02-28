//
//  MultiLineStackViewLabel.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/20/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//
import UIKit

class MultilineLabelThatWorks : UILabel {
    override func layoutSubviews() {
        super.layoutSubviews()
        preferredMaxLayoutWidth = bounds.width
        super.layoutSubviews()
    }
}
