//
//  RegisterEmailController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/9/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import Foundation
import UIKit

class RegisterEmailController: BaseController, UITextFieldDelegate{
    @IBOutlet weak var emailAddressTextField: UITextField!
    
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var verifyEmailButton: UIButton!
    
    @IBOutlet weak var alreadyHaveAccountButton: UIButton!
    
    var isResettingPassword = false;
    
    override func viewDidLoad() {
//        if(DataStore.get().getControllerWithIdentifier(identifier: "RegisterEmailController") == nil){
//            DataStore.get().addControllerWithIdentifier(identifier: "RegisterEmailController", controller: self)
//        }
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.
        emailAddressTextField.returnKeyType = .done
        emailAddressTextField.delegate = self;
        emailAddressTextField.keyboardType = .emailAddress
        emailAddressTextField.autocorrectionType = .no
        emailAddressTextField.autocapitalizationType = .none;
        emailAddressTextField.spellCheckingType = .no
        
        if(isResettingPassword){
            verifyEmailButton.setTitle("Reset Password", for: .normal);
            alreadyHaveAccountButton.setTitle("Return To Login", for: .normal)
            titleLabel.text = "Reset Password"
        }
        else{
            verifyEmailButton.setTitle("Verify Email", for: .normal);
            titleLabel.text = "Register"
        }
        
        verifyEmailButton.addTarget(self, action: #selector(verifyEmailButtonClicked(button:)), for: .touchUpInside)
    }
        
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    func verifyEmailButtonClicked(button:UIButton){
        showActivityIndicator();
        let email_address = emailAddressTextField.text!
        if(isResettingPassword){
            DataStore.get().socket.emit("reset_password_email_address", ["email_address": email_address]);
            //remove the handler before adding to avoid duplicate handlers
            DataStore.get().socket.off("reset_password_email_address_response");
            //we must add the handler here locally because it requires some local context that DataStore doesn't have at the time of creation,
            DataStore.get().socket.on("reset_password_email_address_response") {data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("no error")
                    self.hideActivityIndicator();
//                    let alertController = UIAlertController(title: "Verification Link Sent", message: "A verification link was sent to your email, click it to proceed", preferredStyle: UIAlertControllerStyle.alert)
//                    let okAction = UIAlertAction(title: "Ok", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
//                    }
//                    alertController.addAction(okAction)
//                    UIApplication.topViewController()?.present(alertController, animated: true, completion: nil)
                    let storyboard = UIStoryboard(name: "Main", bundle: nil)
                    let controller = storyboard.instantiateViewController(withIdentifier: "RegisterVerificationCodeController") as! RegisterVerificationCodeController
                    controller.isResettingPassword = true;
                    controller.email_address = email_address;
                    self.present(controller, animated: true, completion: nil)
                }
                else{
                    self.hideActivityIndicator();
                    DataStore.get().error_handler(error: response["error"]! as! String);
                }
            }
        }
        else{
            DataStore.get().socket.emit("register_email_address", ["email_address": email_address]);
            //remove the handler before adding to avoid duplicate handlers
            DataStore.get().socket.off("register_email_address_response");
            //we must add the handler here locally because it requires some local context that DataStore doesn't have at the time of creation,
            DataStore.get().socket.on("register_email_address_response") {data, ack in
                self.hideActivityIndicator();
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("no error")
                    let storyboard = UIStoryboard(name: "Main", bundle: nil)
                    let controller = storyboard.instantiateViewController(withIdentifier: "RegisterVerificationCodeController") as! RegisterVerificationCodeController
                    controller.email_address = email_address;
                    self.present(controller, animated: true, completion: nil)
                }
                else{
                    self.hideActivityIndicator();
                    DataStore.get().error_handler(error: response["error"]! as! String);
                }
            }
        }
        
    }
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.endEditing(true)
        verifyEmailButtonClicked(button: verifyEmailButton);
        return false;
    }
    
    func error_handler(error: String){
        let alertController = UIAlertController(title: "Error", message: error, preferredStyle: UIAlertControllerStyle.alert)
        let okAction = UIAlertAction(title: "Ok", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
        }
        alertController.addAction(okAction)
        self.present(alertController, animated: true, completion: nil)
    }

}
