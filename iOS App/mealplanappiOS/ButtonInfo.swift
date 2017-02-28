//
//  ButtonInfo.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/29/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//
import UIKit

class ButtonInfo{
    var title: String;
    var handler:((UIButton) -> ())
    
    //used for radio buttons, to signify which one is selected if any
    var selected: Bool?
    init(title: String, handler: @escaping ((UIButton) -> ()), selected: Bool?){
        self.title = title
        self.handler = handler;
        self.selected = selected;
    }
}

enum StackViewOrientation{
    case horizontal
    case vertical
}
