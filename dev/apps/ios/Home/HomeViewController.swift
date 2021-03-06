//
//  HomeViewController.swift
//  ActorApp
//
//  Created by 李金山 on 15/10/17.
//  Copyright © 2015年 Actor LLC. All rights reserved.
//

import Foundation
import UIKit
import Haneke
import MBProgressHUD
import TOWebViewController
import JDStatusBarNotification

public class HomeViewController: UITableViewController{
    let botsurl = "https://app.ezing.cn/bots/bots/"
    //var tableView :UITableView?
    var bots:NSArray? = []
    public  init() {
        super.init(nibName: nil, bundle: nil)
        
        //view.backgroundColor = appStyle.vcBackyardColor
    }
    
    //public init() {
    //super.init(style: AAContentTableStyle.SettingsPlain)
    
    //tabBarItem = UITabBarItem(title: "TabDiscover", img: "TabIconDiscover", selImage: "TabIconDiscoverHighlighted")
    //navigationItem.title = "易致"
    //}
    public required init(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    public override func viewDidLoad() {
        super.viewDidLoad()
        
        // Setting UITabBarItem
        
        tabBarItem = UITabBarItem(title: "TabDiscover", img: "TabIconDiscover", selImage: "TabIconDiscoverHighlighted")
        
        
        navigationItem.title = "易致"
        
        self.tableView!.rowHeight = 66
        
        JDStatusBarNotification.showWithStatus(AALocalized("StatusSyncing"))
        let cache = Cache<JSON>(name: "bots_latest")
        let URL = NSURL(string: botsurl)!
        var error:NSError?
        let isReachable = URL.checkResourceIsReachableAndReturnError(&error)
        if(isReachable){
            cache.removeAll()
        }
        cache.synfetch(URL: URL).onSuccess { JSON in
            JDStatusBarNotification.dismiss()
            self.bots = JSON.dictionary?["bots"] as? NSArray;
            self.tableView?.reloadData()
            }.onFailure { failure in
                JDStatusBarNotification.dismiss()
        }
        
    }
    
    public override func viewWillAppear(animated: Bool) {
        super.viewWillAppear(animated)
        
        JDStatusBarNotification.showWithStatus(AALocalized("StatusSyncing"))
        
        let cache = Cache<JSON>(name: "bots_latest")
        let URL = NSURL(string: botsurl)!
        var error:NSError?
        let isReachable = URL.checkResourceIsReachableAndReturnError(&error)
        if(isReachable){
            cache.removeAll()
        }
        cache.fetch(URL: URL).onSuccess { JSON in
            JDStatusBarNotification.dismiss()
            self.bots = JSON.dictionary?["bots"] as? NSArray;
            self.tableView?.reloadData()
            }.onFailure { failure in
            JDStatusBarNotification.dismiss()
        }
    }
    
    public override func tableView(tableView:UITableView, numberOfRowsInSection section:Int) -> Int
    {
        return (self.bots?.count)!;
    }
    
    public override func tableView(tableView:UITableView, cellForRowAtIndexPath indexPath:NSIndexPath) -> UITableViewCell
    {
        let cell = UITableViewCell(style: UITableViewCellStyle.Subtitle,reuseIdentifier: "cell")
        let bot = self.bots?[indexPath.row] as! NSDictionary;
        
        let name = bot["name"] as! NSString
        cell.textLabel!.text = name as String
        
        let desc = bot["desc"] as! NSString
        cell.detailTextLabel!.text = desc as String
        cell.detailTextLabel?.numberOfLines = 0
        
        cell.detailTextLabel!.textColor = UIColor.darkGrayColor()
        
        let labeltext = cell.textLabel!.text as NSString?
        let title = labeltext!.substringToIndex(1)
        cell.imageView?.image = Placeholders.avatarPlaceholder(jint(indexPath.row),size: 44, title:title, rounded: true)
        
        return cell
    }
    
    public override func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        let bot = self.bots?[indexPath.row] as! NSDictionary;
        
        let url = bot["url"]
        if url != nil {
            let urlString = bot["url"] as! NSString as String
            /*webVC.loadURLWithString(urlString)
            self.navigateNext(webVC)
            webVC.toolbar.toolbarTintColor = UIColor.darkGrayColor()
            webVC.toolbar.toolbarBackgroundColor = UIColor.whiteColor()
            webVC.toolbar.toolbarTranslucent = false
            webVC.allowsBackForwardNavigationGestures = true
            
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW,Int64(1 * Double(NSEC_PER_SEC))),dispatch_get_main_queue(), {
            self.webVC.showToolbar(true, animated: true)
            })*/
            
            let browser = TOWebViewController(URLString: urlString)
            browser.showUrlWhileLoading = false
            self.navigateDetail(browser)
            
        }else{
            let nickname = bot["nickname"] as! NSString as String
            
            self.executeSafeOnlySuccess(Actor.findUsersCommandWithQuery(nickname), successBlock: { (val) -> Void in
                var user: ACUserVM? = nil
                if let users = val as? IOSObjectArray {
                    if Int(users.length()) > 0 {
                        if let tempUser = users.objectAtIndex(0) as? ACUserVM {
                            user = tempUser
                        }
                    }
                }
                
                if user != nil {
                    self.execute(Actor.addContactCommandWithUid(user!.getId())!, successBlock: { (val) -> Void in
                        self.navigateDetail(ConversationViewController(peer: ACPeer_userWithInt_(user!.getId())))
                        //self.dismiss()
                        }, failureBlock: { (val) -> Void in
                            self.navigateDetail(ConversationViewController(peer: ACPeer_userWithInt_(user!.getId())))
                            //self.dismiss()
                    })
                } else {
                    self.alertUser("FindNotFound")
                }
            })
            
        }
        
    }
}
