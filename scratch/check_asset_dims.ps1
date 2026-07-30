Add-Type -AssemblyName System.Drawing

$files = @(
    "c:\Users\KB\Desktop\Beteseb\Family\public\logo.png",
    "c:\Users\KB\Desktop\Beteseb\Family\public\icon-192x192.png",
    "c:\Users\KB\Desktop\Beteseb\Family\public\icon-512x512.png",
    "c:\Users\KB\Desktop\Beteseb\Family\resources\icon.png",
    "c:\Users\KB\Desktop\Beteseb\Family\src\app\favicon.ico",
    "c:\Users\KB\Desktop\Beteseb\Family\android\app\src\main\res\mipmap-hdpi\ic_launcher.png",
    "c:\Users\KB\Desktop\Beteseb\Family\android\app\src\main\res\mipmap-hdpi\ic_launcher_foreground.png",
    "c:\Users\KB\Desktop\Beteseb\Family\android\app\src\main\res\drawable-port-hdpi\splash.png",
    "c:\Users\KB\Desktop\Beteseb\Family\ios\App\App\Assets.xcassets\AppIcon.appiconset\AppIcon-512@2x.png",
    "c:\Users\KB\Desktop\Beteseb\Family\ios\App\App\Assets.xcassets\Splash.imageset\splash-2732x2732.png"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        try {
            $img = [System.Drawing.Image]::FromFile($f)
            Write-Host "$($f): $($img.Width)x$($img.Height)"
            $img.Dispose()
        } catch {
            Write-Host "$($f): Error reading image ($($_.Exception.Message))"
        }
    } else {
        Write-Host "$($f): File not found"
    }
}
