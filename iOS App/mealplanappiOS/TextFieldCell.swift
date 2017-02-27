//
//  TextFieldCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/13/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit


class TextFieldCell: UITableViewCell, UITextFieldDelegate, UITextViewDelegate{
    
    let placeHolderColor = DataStore.get().placeHolderColor

//    var textField = UITextField();
//    var textView = UITextView();
    
    @IBOutlet weak var stackView: UIStackView!
    var textFieldInfoArray: [TextFieldInfo]?
    
    var placeHolderLabelArray = [UILabel]();
    
    var tableView: UITableView?
    
    enum TextFieldType{
        case singleLine
        case multiLine
        case date
    }

    var type: TextFieldType?;
    
    var placeholder:String?
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder);
    }
    
    var datePicker = UIDatePicker();
    var textField: UITextField?
    
    func setTextFields(textFieldInfoArray: [TextFieldInfo]){
        self.textFieldInfoArray = textFieldInfoArray;
        var tagIndex = 0;
        if(stackView.subviews.count == 0){
            for textFieldInfo in textFieldInfoArray{
                self.type = textFieldInfo.type
                if(textFieldInfo.type == .singleLine){
                    let textField = UITextField();
                    textField.delegate = self;
                    textField.returnKeyType = .done;
                    textField.placeholder = textFieldInfo.placeholder;
                    textField.text = textFieldInfo.text;
                    if textFieldInfo.keyboardType != nil{
                        textField.keyboardType = textFieldInfo.keyboardType!;
                    }
                    self.textField = textField;
                    stackView.addArrangedSubview(textField);
                }
                else if(textFieldInfo.type == .multiLine){
                    let placeHolderLabel = UILabel()
                    
                    let textView = UITextView(frame: CGRect(x: 0, y: 0, width: 100, height: 100))

                    textView.isScrollEnabled = false
                    if textFieldInfo.keyboardType != nil{
                        textView.keyboardType = textFieldInfo.keyboardType!;
                    }
                    textView.contentInset = UIEdgeInsets.zero;
                    textView.delegate = self;
                    
    //                    textView.layer.borderWidth = 0.5;
    //                    textView.layer.borderColor = placeHolderColor.cgColor
    //                    textView.layer.cornerRadius = 5;
                    textView.returnKeyType = .done;
                    
                    textView.tag = tagIndex;
                    textView.font = UIFont.systemFont(ofSize: 17);
                    placeHolderLabel.text = placeholder;
                    placeHolderLabel.font = UIFont.systemFont(ofSize: (textView.font?.pointSize)!)
                    placeHolderLabel.frame.origin = CGPoint(x: 5, y: (textView.font?.pointSize)! / 2)
                    placeHolderLabel.textColor = placeHolderColor;
                    placeHolderLabel.isHidden = !textView.text.isEmpty
                    placeHolderLabel.tag = tagIndex;

    //                    placeHolderLabel.sizeToFit()
                    textView.addSubview(placeHolderLabel)

                    
                    
                    
                   
                    placeHolderLabelArray.append(placeHolderLabel);
                    stackView.addArrangedSubview(textView);
                    
                    tagIndex+=1;
                }
                else if(textFieldInfo.type == .date){
                    datePicker.datePickerMode = UIDatePickerMode.dateAndTime
                    datePicker.addTarget( self, action: #selector(expirationTimePickerChanged(datePicker:)), for: UIControlEvents.valueChanged )
                    datePicker.maximumDate = Calendar.current.date(byAdding: .day, value: +7, to: Date())
                    datePicker.minimumDate = Date();
                    let textField = UITextField();
                    textField.text = textFieldInfo.text
                    textField.delegate = self;
                    textField.inputView = datePicker
//                    textField.returnKeyType = .done;
                    textField.placeholder = textFieldInfo.placeholder;
//                    textField.text = textFieldInfo.text;
//                    if textFieldInfo.keyboardType != nil{
//                        textField.keyboardType = textFieldInfo.keyboardType!;
//                    }
                    self.textField = textField;
                    stackView.addArrangedSubview(textField);

                }
            }
        }
    }
    
    func textFieldDidBeginEditing(_ textField: UITextField) {
        if(self.type == TextFieldType.date){
            DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(250)) {
                self.tableView?.scrollToRow(at: IndexPath(row: 0, section: 3), at: .bottom, animated: true)
            }
        }
    }
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.endEditing(true)
        return true;
    }
    
    func textViewDidChange(_ textView: UITextView) {
        for placeHolderLabel in placeHolderLabelArray{
            if(placeHolderLabel.tag == textView.tag){
                placeHolderLabel.isHidden = !textView.text.isEmpty;
            }
        }
    }
    
    func textViewDidChange(textView: UITextView) {
        
    }
    
    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
        if(text == "\n")
        {
            self.contentView.endEditing(true)
            return false
        }
        return true;
    }
    
    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        let currentCharacterCount = textField.text?.utf8.count
//        print("currentCharacterCount:" + String(currentCharacterCount));
        
        let newLength = currentCharacterCount! + string.utf8.count
        if let maxLength = textFieldInfoArray?[0].maxLength{
            return newLength <= maxLength;
        }
        return true;
       
    }
    
//    func textField(textField: UITextField, shouldChangeCharactersInRange range: NSRange, replacementString string: String) -> Bool {
//        
//        let currentCharacterCount = textField.text?.characters.count ?? 0
//        if (range.length + range.location > (textField.text?.utf16.count)!){ return false; }
//        let newLength = currentCharacterCount + string.characters.count - range.length
//        if let maxLength = textFieldInfoArray?[0].maxLength{
//            return newLength <= maxLength
//        }
//        return true;
//    }
    
    func expirationTimePickerChanged(datePicker: UIDatePicker){
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = DateFormatter.Style.short
        dateFormatter.timeStyle = DateFormatter.Style.short
        let strDate = dateFormatter.string(from: datePicker.date)
        self.textField?.text = strDate
    }
    
    
    

    
}
