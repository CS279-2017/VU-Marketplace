//
//  CollectionViewCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/29/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class PicturesCell: UITableViewCell, UICollectionViewDataSource, UICollectionViewDelegate, SelectPictureDelegate, DeletePictureDelegate{
    
    enum PictureCellType{
        case edit
        case view
        case makeListing
    }
    
    var listing: Listing?
    var type: PictureCellType?
    var pictures:[Picture] = [Picture]();
    
    var pictures_loaded: Int?
    
    var deleted_pictures = [Picture]()
    
    @IBOutlet weak var collectionView: UICollectionView!
    
    override init(style: UITableViewCellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier);
    }
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    override func awakeFromNib() {
        collectionView.delegate = self;
        collectionView.dataSource = self;
        if let layout = collectionView.collectionViewLayout as? UICollectionViewFlowLayout {
            layout.scrollDirection = .horizontal
            layout.minimumInteritemSpacing = 8
            layout.minimumLineSpacing = 8
//            layout.sectionInset = UIEdgeInsets(top: 0, left: 8, bottom: 0, right: 8)

        }
        pictures_loaded = 0;
    }
    
    func setPictures(pictures: [Picture]){
        self.pictures = pictures;
    }
    
    func setListing(listing: Listing){
        self.listing = listing;
    }
    
    func setType(type: PictureCellType)
    {
        self.type = type;
    }
    
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        if(self.type == .edit || self.type == .makeListing){
            return pictures.count + 1;
        }
        return pictures.count;
    }
    
    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
//        let tappedImageView = gestureRecognizer.view! as! UIImageView
        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
        var controller: UIViewController;
        if(self.type == .view){
            controller = storyBoard.instantiateViewController(withIdentifier: "PictureDisplayController") as! PictureDisplayController
        }
        else{
            controller = storyBoard.instantiateViewController(withIdentifier: "PictureViewController") as! PictureViewController
        }
        
        //        controller.picture = Picture(image: <#T##UIImage?#>, picture_id: String?)
        //tappedImageView.image!
        if(controller is PictureViewController){
            let controller = (controller as! PictureViewController)
            controller.delegate = self;
//            if(self.type == .edit){
//                if let picture_id = self.pictures[indexPath.row - 1]._id{
//                    controller.setPictureId(picture_id: picture_id)
//                }
//                controller.picture = self.pictures[indexPath.row - 1]
//            }
            if(self.type == .makeListing || self.type == .edit){
                controller.picture = self.pictures[indexPath.row - 1]
                if let picture_id = self.pictures[indexPath.row - 1]._id{
                    controller.setPictureId(picture_id: picture_id)
                }
                controller.setPictureIndex(picture_index: indexPath.row - 1)
            }
            else{
                controller.picture = self.pictures[indexPath.row]
            }
        }
        if(controller is PictureDisplayController){
            let controller = (controller as! PictureDisplayController)
            if let image = self.pictures[indexPath.row].image{
                controller.setImage(image: image);
            }
        }
        let topViewController = UIApplication.topViewController();
        topViewController?.present(controller, animated: true, completion: nil)
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        if(indexPath.row == 0 && (self.type == .edit || self.type == .makeListing)){
            let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "ButtonCollectionViewCell", for: indexPath) as! ButtonCollectionViewCell
            func buttonClicked(button: UIButton){
                if (self.pictures.count > DataStore.get().maxPicturesPerListing){
                    DataStore.get().error_handler(error: "You can only have a maximum of " + String(DataStore.get().maxPicturesPerListing) + " pictures per listing");
                    return;
                }
                let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
                let controller = storyBoard.instantiateViewController(withIdentifier: "PictureViewController") as! PictureViewController
                controller.delegate = self;
               
                UIApplication.topViewController()?.present(controller, animated: true, completion: nil)
            }
            cell.setButtonInfo(buttonInfo: ButtonInfo(title: "Add Picture", handler: buttonClicked, selected: false))
            return cell;
        }
        else{
            let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "PictureCell", for: indexPath) as! PictureCell
            cell.imageView.image = nil; 
            let index = (self.type == .edit || self.type == .makeListing) ? indexPath.row - 1 : indexPath.row;
            if pictures[index].image == nil{
                if let picture_id = pictures[index]._id{
                    if let image = DataStore.get().getUserPicture(picture_id: picture_id){
                        let picture = Picture(image: image, picture_id: picture_id)
                        self.pictures[index] = picture;
                        cell.setPicture(picture: picture);
                    }
                    else{
//                        DataStore.get().getPicture(picture_id: picture_id, callback: {_,_ in
//                            self.pictures_loaded! += 1;
//                            if(self.pictures_loaded == self.pictures.count){
//                                collectionView.reloadData();
//                                self.pictures_loaded = 0;
//                            }
//                        }, error_handler: {_ in })
                    }
                }
            }
            else{
                let index = (self.type == .edit || self.type == .makeListing) ? indexPath.row - 1 : indexPath.row;
                if pictures[index].image != nil{
                    if let picture_id = pictures[index]._id{
                        if let image = DataStore.get().getUserPicture(picture_id: picture_id){
                            let picture = Picture(image: image, picture_id: picture_id)
                            self.pictures[index] = picture;
                            cell.setPicture(picture: picture);
                        }
                    }
                    else{
                        cell.setPicture(picture: pictures[index])
                    }
                }
            }
            return cell;
        }
       
    }
    
    func pictureSelected(picture: Picture){
        var row = 0;
        if(picture._id != nil){
            for pic in pictures{
                if pic._id == picture._id{
                    pic.image = picture.image;
                    //                    let picture = Picture(image: picture.image, picture_id: pictures[row]._id)
                    //                    self.pictures[row] = picture;
                    print(pic.image == picture.image);
                    print(pictures[row].image == picture.image)
                    
                }
                row += 1;
            }
        }
        else if(picture.index != nil){
            pictures[picture.index!] = picture;
        }
        else{
            pictures.append(picture)
        }
        collectionView.reloadData();
    }
    
    func pictureDeleted(picture: Picture) {
        var index = 0;
        for pic in pictures{
            if(pic._id == picture._id){
                pictures.remove(at: index);
                if(self.type == .edit){
                    deleted_pictures.append(pic)
                }
            }
            index += 1;
        }
        collectionView.reloadData();

        
    }
}
