//
//  RegisterVerificationCodeController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/9/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//


import Foundation
import UIKit

class RegisterVerificationCodeController: BaseController, UITextFieldDelegate{
    
    @IBOutlet weak var emailWasSentTo: UILabel!
    
    @IBOutlet weak var verificationCodeTextField: UITextField!
    
    @IBOutlet weak var passwordTextField: UITextField!
    
    @IBOutlet weak var confirmPasswordTextField: UITextField!
    
    @IBOutlet weak var registerButton: UIButton!
    
    @IBOutlet weak var resendCodeButton: UIButton!
    
    @IBOutlet weak var passwordLabel: UILabel!
    @IBOutlet weak var confirmPasswordLabel: UILabel!
    
    @IBOutlet weak var alreadyHaveAnAccountButton: UIButton!
    @IBOutlet weak var useADifferentEmailButton: UIButton!
    
    var isResettingPassword = false;
    
    var email_address:String?;
    
    override func viewDidLoad() {
        super.viewDidLoad()
//        if(DataStore.get().getControllerWithIdentifier(identifier: "RegisterVerificationCodeController") == nil){
//            DataStore.get().addControllerWithIdentifier(identifier: "RegisterVerificationCodeController", controller: self)
//        }
        
        verificationCodeTextField.returnKeyType = .next
        verificationCodeTextField.autocapitalizationType = .none
        verificationCodeTextField.autocorrectionType = .no
        verificationCodeTextField.spellCheckingType = .no
        
        passwordTextField.returnKeyType = .next
        confirmPasswordTextField.returnKeyType = .done
        
        verificationCodeTextField.delegate = self;
        passwordTextField.delegate = self;
        confirmPasswordTextField.delegate = self;
        
        //hides the characters of the password entry
        passwordTextField.isSecureTextEntry = true;
        confirmPasswordTextField.isSecureTextEntry = true;
        
        registerButton.addTarget(self, action: #selector(registerButtonClicked(button:)), for: .touchUpInside)
        resendCodeButton.addTarget(self, action: #selector(resendCodeButtonClicked(button:)), for: .touchUpInside);
        
        if(isResettingPassword){
            registerButton.setTitle("Change Password", for: .normal)
            useADifferentEmailButton.isHidden = true;
        alreadyHaveAnAccountButton.setTitle("Return To Login", for: .normal)
        }
        
        emailWasSentTo.text = "An Email Was Sent To:\n" + self.email_address!
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        if(textField == verificationCodeTextField){
            textField.resignFirstResponder();
            passwordTextField.becomeFirstResponder();
        }
        else if(textField == passwordTextField){
            textField.resignFirstResponder();
            confirmPasswordTextField.becomeFirstResponder();
        }
        else if(textField == confirmPasswordTextField){
            textField.endEditing(true)
            registerButtonClicked(button: registerButton)
        }
        return false;
    }
    
    //1. pull the values in the textFields, store in variables
    //2. emit a register_verification_code to socket, passing in the variables, as well as email_address which was passed in from RegisterEmailController
    //3. add a handler to socket to listen for register_verification_code_response, first removing any preexisting handler for that event
    //4. when that event is triggered, indicates successful registration, redirect to LoginController

    func registerButtonClicked(button: UIButton){
        let verification_code:String = verificationCodeTextField.text!
        let email_address:String = self.email_address!
        let password:String = passwordTextField.text!
        let confirmPassword:String = confirmPasswordTextField.text!
        if(password != confirmPassword){
            DataStore.get().error_handler(error: "Passwords don't match");
        }
        else{
            showActivityIndicator();
            if(!isResettingPassword){
                DataStore.get().socket.emit("register_verification_code", ["verification_code": verification_code, "email_address": email_address, "password": password]);
                DataStore.get().socket.off("register_verification_code_response");
                
                DataStore.get().socket.on("register_verification_code_response"){data, ack in
                    self.hideActivityIndicator();
                    let response = data[0] as! Dictionary<String, Any>
                    if(response["error"]! is NSNull){
                        print("registration successful!")
                        func callback(user: User){
                            let topViewController = UIApplication.topViewController();
                            if !(topViewController is MainController){
                                if let controller = DataStore.get().getControllerWithIdentifier(identifier: "RegisterUserDataControlelr"){
                                    topViewController?.show(controller, sender: topViewController)
                                }
                                else{
                                    let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
                                    let controller : UIViewController = storyBoard.instantiateViewController(withIdentifier: "RegisterUserDataController") as! RegisterUserDataController
                                    topViewController?.show(controller, sender: topViewController)
                                }
                            }
                        }
                        
                        DataStore.get().login(email_address: email_address, password: password, callback: callback, error_handler: DataStore.get().error_handler)
                    }
                    else{
                        DataStore.get().error_handler(error: response["error"]! as! String);
                    }
                }
            }
            else{
                DataStore.get().socket.emit("reset_password_verification_code", ["verification_code": verification_code, "email_address": email_address, "password": password]);
                DataStore.get().socket.off("reset_password_verification_code_response");
                
                DataStore.get().socket.on("reset_password_verification_code_response"){data, ack in
                    self.hideActivityIndicator();
                    let response = data[0] as! Dictionary<String, Any>
                    if(response["error"]! is NSNull){
                        print("registration successful!")
                        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
                        let controller : LoginController = storyBoard.instantiateViewController(withIdentifier: "LoginController") as! LoginController
                        UIApplication.topViewController()?.present(controller, animated: true)
                    }
                    else{
                        DataStore.get().error_handler(error: response["error"]! as! String);
                    }

                }
            }
            
        }
    }
    
    func resendCodeButtonClicked(button:UIButton){
        if(isResettingPassword){
            DataStore.get().socket.emit("reset_password_email_address", ["email_address": self.email_address!]);
            //remove the handler before adding to avoid duplicate handlers
            DataStore.get().socket.off("reset_password_email_address_response");
            //we must add the handler here locally because it requires some local context that DataStore doesn't have at the time of creation,
            DataStore.get().socket.on("reset_password_email_address_response") {data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("code was resent!")
                }
                else{
                    DataStore.get().error_handler(error: response["error"]! as! String);
                }
            }
        }
        else{
            DataStore.get().socket.emit("register_email_address", ["email_address": self.email_address!]);
            //remove the handler before adding to avoid duplicate handlers
            DataStore.get().socket.off("register_email_address_response");
            //we must add the handler here locally because it requires some local context that DataStore doesn't have at the time of creation,
            DataStore.get().socket.on("register_email_address_response") {data, ack in
                let response = data[0] as! Dictionary<String, Any>
                if(response["error"]! is NSNull){
                    print("code was resent!")
                }
                else{
                    DataStore.get().error_handler(error: response["error"]! as! String);
                }
            }
        }
    }
}

