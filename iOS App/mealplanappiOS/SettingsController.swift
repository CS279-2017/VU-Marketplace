//
//  SettingsController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/18/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//
import Foundation
import UIKit

class SettingsController: BaseTableViewController, UITextFieldDelegate, UIImagePickerControllerDelegate, UINavigationControllerDelegate, SelectPictureDelegate, DeletePictureDelegate
{

    @IBOutlet weak var profilePictureView: UIImageView!
    @IBOutlet weak var nameLabel: UILabel!
    @IBOutlet weak var venmoIdTextField: UITextField!
    @IBOutlet weak var logoutButton: UIButton!
    
    var logoutButtonDisabled = false;
    
    let imagePickerController = UIImagePickerController();
    
    override func viewDidLoad() {
        super.viewDidLoad();
        
        imagePickerController.delegate = self;
         self.imagePickerController.allowsEditing = true
        //prevents the static cells from being selected i.e highlighted
        self.tableView.allowsSelection = false;
        if let user_data = UserData.get(){
            if let venmo_id = user_data.venmo_id{
                venmoIdTextField.text! = venmo_id
            }
        }
        
        if let profile_picture = UserData.get()?.profile_picture{
            profilePictureView.image = profile_picture;
        }
        else{
            profilePictureView.image = #imageLiteral(resourceName: "profile_pic")
        }
        
        venmoIdTextField.delegate = self;
        venmoIdTextField.returnKeyType = .done
        
        //this will be called back everytime profile_picture_gotten is called back
        //thus we need to filter out all those calls returning profile pictures of user_ids other than our own.

        
        logoutButton.addTarget(self, action: #selector(logoutButtonClicked(button:)), for: .touchUpInside)
        
        let tap = UITapGestureRecognizer.init(target: self, action: #selector(profilePictureViewTapped));
        profilePictureView.addGestureRecognizer(tap);
        profilePictureView.isUserInteractionEnabled = true;

    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated);
        if let profile_picture = UserData.get()?.profile_picture{
            profilePictureView.image = profile_picture;
        }
        else{
            profilePictureView.image = #imageLiteral(resourceName: "profile_pic")
        }
        
        nameLabel.text = nil;
        if let first_name = UserData.get()?.first_name{
            if let last_name = UserData.get()?.last_name{
                nameLabel.text = first_name + " " + last_name;
            }
        }
        
        venmoIdTextField.text = nil;
        if let venmo_id = UserData.get()?.venmo_id{
            venmoIdTextField.text = venmo_id;
        }
    }
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.endEditing(true)
        return true;
    }
    
    func textFieldDidEndEditing(_ textField: UITextField) {
        let user_id = UserData.get()?.user_id!
        let password = UserData.get()?.password!
        UserData.set(venmo_id: venmoIdTextField.text!)
        func callback(updated_venmo_id:String){
            print("venmo id" + updated_venmo_id + " sent to server")
        }
        func error_handler(error: String){
            print("venmo id failed to send to server");
        }
        DataStore.get().updateVenmoId(venmo_id: (UserData.get()?.venmo_id)!, callback: callback, error_handler: error_handler)
    }
    
    func logoutButtonClicked(button: UIButton){
        let user_id = UserData.get()?.user_id!
        let password = UserData.get()?.password!
        func callback(){
            let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
            let controller : UIViewController = storyBoard.instantiateViewController(withIdentifier: "LoginController") as! LoginController
            self.show(controller, sender: self);
            logoutButtonDisabled = false;
        }
        func error_handler(error:String){
            logoutButtonDisabled = false;
            print(error);
        }
        if(!logoutButtonDisabled){
            DataStore.get().logout(user_id: user_id!, password: password!, callback: callback, error_handler: error_handler)
            logoutButtonDisabled = true;
        }
    }
    
    func profilePictureViewTapped(){
        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
        let controller : PictureViewController = storyBoard.instantiateViewController(withIdentifier: "PictureViewController") as! PictureViewController
        controller.delegate = self;
        controller.setType(type: .updateProfilePicture)
        controller.picture = Picture(image: self.profilePictureView.image, picture_id: nil)
        self.show(controller, sender: self);
    }
    
    
    func pictureSelected(picture: Picture) {
        profilePictureView.image = picture.image;
    }
    
    func pictureDeleted(picture: Picture) {
        profilePictureView.image = #imageLiteral(resourceName: "profile_pic");
    }
    
    func error_handler(error: String){
        let alertController = UIAlertController(title: "Error", message: error, preferredStyle: UIAlertControllerStyle.alert)
        let okAction = UIAlertAction(title: "Ok", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
        }
        alertController.addAction(okAction)
        self.present(alertController, animated: true, completion: nil)
    }
    
}
