//
//  ViewController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/8/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

//pushed ontop of the MainController
//1.gets email_address and password input from the user
//2.sends the data in a 'login' socket event to the server
//3.waits from login_response(user_id)
//4. once logged in saves email_address, password, and user_id into UserData;
class LoginController: BaseController, UITextFieldDelegate{
    @IBOutlet weak var emailAddressTextField: UITextField!

    @IBOutlet weak var passwordTextField: UITextField!
    
    @IBOutlet weak var loginButton: UIButton!
    
    @IBOutlet weak var forgotPasswordButton: UIButton!
    override func viewDidLoad() {
        super.viewDidLoad()
        
        //save controller in DataStore to be reused
        // Do any additional setup after loading the view, typically from a nib.
        emailAddressTextField.returnKeyType = .next
        emailAddressTextField.delegate = self;
        emailAddressTextField.keyboardType = .emailAddress
        emailAddressTextField.autocapitalizationType = .none
        emailAddressTextField.autocorrectionType = .no
        emailAddressTextField.spellCheckingType = .no
        
        passwordTextField.returnKeyType = .done
        passwordTextField.delegate = self;
        passwordTextField.isSecureTextEntry = true;
        loginButton.addTarget(self, action: #selector(loginButtonClicked(button:)), for: .touchUpInside)
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    func loginButtonClicked(button:UIButton){
        let email_address = emailAddressTextField.text!
        let password = passwordTextField.text!
        func callback(user: User){
            hideActivityIndicator();
            self.view.window!.rootViewController?.dismiss(animated: false, completion: nil)
        }
        showActivityIndicator();
        DataStore.get().login(email_address: email_address, password: password, callback: callback, error_handler: {error in
            self.hideActivityIndicator()
            self.error_handler(error: error);
        });

    }
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        if(textField == emailAddressTextField){
            textField.resignFirstResponder();
            passwordTextField.becomeFirstResponder();
        }
        else{
            textField.endEditing(true)
        }
        return true;
    }
    
    func error_handler(error: String){
        let alertController = UIAlertController(title: "Error", message: error, preferredStyle: UIAlertControllerStyle.alert)
        let okAction = UIAlertAction(title: "Ok", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
        }
        alertController.addAction(okAction)
        self.present(alertController, animated: true, completion: nil)
    }
    
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if(segue.identifier == "ForgotPasswordSegue"){
            let destinationVC = segue.destination as! RegisterEmailController
            destinationVC.isResettingPassword = true
        }
        
    }
}


