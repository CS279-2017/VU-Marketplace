//
//  PriceTextField.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/14/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class PriceTextField:UITextField, UITextFieldDelegate{

    
    override func awakeFromNib() {
        self.delegate = self;
    }
    
    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        var currentString = self.text!

        
        // Construct the text that will be in the field if this change is accepted
        
        switch string {
        case "0","1","2","3","4","5","6","7","8","9":
            currentString += string
            formatCurrency(currentString)
        default:
            if string.characters.count == 0 && currentString.characters.count != 0 {
                currentString = String(currentString.characters.dropLast())
                formatCurrency(currentString)
            }
        }
        return false    }
    
    func formatCurrency(_ string: String) {
        let currentString = self.text!

        print("format \(string)")
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = findLocaleByCurrencyCode("NGN")
        let numberFromField = (NSString(string: currentString).doubleValue)/100
        let temp = formatter.string(from: NSNumber(value: numberFromField))
        self.text = String(describing: temp!.characters.dropFirst())
    }
    
    func findLocaleByCurrencyCode(_ currencyCode: String) -> Locale? {
        
        let locales = Locale.availableIdentifiers
        var locale: Locale?
        for   localeId in locales {
            locale = Locale(identifier: localeId)
            if let code = (locale! as NSLocale).object(forKey: NSLocale.Key.currencyCode) as? String {
                if code == currencyCode {
                    return locale
                }   
            } 
        }    
        return locale }
}
