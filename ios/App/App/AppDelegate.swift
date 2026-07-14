import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var screenShieldView: UIView?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        FirebaseApp.configure()
        
        NotificationCenter.default.addObserver(self, selector: #selector(screenCapturedChanged), name: UIScreen.capturedDidChangeNotification, object: nil)
        detectScreenCapture()
        
        return true
    }

    @objc func screenCapturedChanged() {
        detectScreenCapture()
    }

    private func detectScreenCapture() {
        DispatchQueue.main.async {
            let isCaptured = UIScreen.main.isCaptured
            if isCaptured {
                self.showScreenShield()
            } else {
                self.hideScreenShield()
            }
        }
    }

    private func showScreenShield() {
        if screenShieldView == nil, let window = self.window {
            let shield = UIView(frame: window.bounds)
            shield.backgroundColor = .black
            
            let label = UILabel()
            label.text = "Screen Recording Protected\nይህ ማያ ገፅ የተጠበቀ ነው"
            label.textColor = .white
            label.font = UIFont.boldSystemFont(ofSize: 18)
            label.textAlignment = .center
            label.numberOfLines = 0
            label.translatesAutoresizingMaskIntoConstraints = false
            
            shield.addSubview(label)
            NSLayoutConstraint.activate([
                label.centerXAnchor.constraint(equalTo: shield.centerXAnchor),
                label.centerYAnchor.constraint(equalTo: shield.centerYAnchor),
                label.leadingAnchor.constraint(equalTo: shield.leadingAnchor, constant: 20),
                label.trailingAnchor.constraint(equalTo: shield.trailingAnchor, constant: -20)
            ])
            
            window.addSubview(shield)
            self.screenShieldView = shield
        }
    }

    private func hideScreenShield() {
        if let shield = screenShieldView {
            shield.removeFromSuperview()
            screenShieldView = nil
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

}
