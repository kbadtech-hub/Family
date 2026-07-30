Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\KB\.gemini\antigravity\brain\5ad1ca3c-ac3d-493b-ade5-154c653025cf\.user_uploaded\media__1785403952618.png"
$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)

# 1. First, extract cropped content bounding box
$minX = $srcImg.Width
$minY = $srcImg.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $srcImg.Height; $y++) {
    for ($x = 0; $x -lt $srcImg.Width; $x++) {
        $p = $srcImg.GetPixel($x, $y)
        if ($p.A -gt 10) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1

Write-Host "Cropped Content: Left=$minX, Top=$minY, Width=$cropW, Height=$cropH"

# Function to render logo onto canvas
function Create-LogoImage {
    param (
        [int]$targetW,
        [int]$targetH,
        [string]$bgColorHex = "Transparent",
        [float]$paddingPercent = 0.15,
        [bool]$centerContent = $true
    )

    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($bgColorHex -ne "Transparent") {
        $bgColor = [System.Drawing.ColorTranslator]::FromHtml($bgColorHex)
        $brush = New-Object System.Drawing.SolidBrush($bgColor)
        $g.FillRectangle($brush, 0, 0, $targetW, $targetH)
        $brush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $availW = $targetW * (1.0 - 2 * $paddingPercent)
    $availH = $targetH * (1.0 - 2 * $paddingPercent)

    $scale = [Math]::Min($availW / $cropW, $availH / $cropH)

    $destW = [int]($cropW * $scale)
    $destH = [int]($cropH * $scale)

    $destX = [int](($targetW - $destW) / 2)
    $destY = [int](($targetH - $destH) / 2)

    $srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)
    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)

    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    return $bmp
}

# Base Output Folder
$rootDir = "c:\Users\KB\Desktop\Beteseb\Family"

# --- A. Generate Main Logo (`public/logo.png`) ---
$logoBmp = Create-LogoImage -targetW 512 -targetH 512 -bgColorHex "Transparent" -paddingPercent 0.10
$logoBmp.Save("$rootDir\public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$logoBmp.Dispose()
Write-Host "Updated public/logo.png"

# --- B. Generate PWA and Favicon Assets ---
$icon512 = Create-LogoImage -targetW 512 -targetH 512 -bgColorHex "Transparent" -paddingPercent 0.10
$icon512.Save("$rootDir\public\icon-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon512.Dispose()
Write-Host "Updated public/icon-512x512.png"

$icon192 = Create-LogoImage -targetW 192 -targetH 192 -bgColorHex "Transparent" -paddingPercent 0.10
$icon192.Save("$rootDir\public\icon-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon192.Dispose()
Write-Host "Updated public/icon-192x192.png"

$icon1024 = Create-LogoImage -targetW 1024 -targetH 1024 -bgColorHex "Transparent" -paddingPercent 0.10
$icon1024.Save("$rootDir\resources\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon1024.Dispose()
Write-Host "Updated resources/icon.png"

$favBmp = Create-LogoImage -targetW 256 -targetH 256 -bgColorHex "Transparent" -paddingPercent 0.08
$favBmp.Save("$rootDir\src\app\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Dispose()
Write-Host "Updated src/app/favicon.ico"

# Icons folder (.webp)
$webpSizes = @(48, 72, 96, 128, 192, 256, 512)
foreach ($sz in $webpSizes) {
    $wBmp = Create-LogoImage -targetW $sz -targetH $sz -bgColorHex "Transparent" -paddingPercent 0.10
    # Save as png (with .webp extension or converting)
    $wBmp.Save("$rootDir\icons\icon-$sz.webp", [System.Drawing.Imaging.ImageFormat]::Png)
    $wBmp.Dispose()
    Write-Host "Updated icons/icon-$sz.webp"
}

# --- C. Generate Android App Icons (Mipmaps) ---
$mipmaps = @{
    "mipmap-ldpi" = @{ size = 36; fg = 81 };
    "mipmap-mdpi" = @{ size = 48; fg = 108 };
    "mipmap-hdpi" = @{ size = 72; fg = 162 };
    "mipmap-xhdpi" = @{ size = 96; fg = 216 };
    "mipmap-xxhdpi" = @{ size = 144; fg = 324 };
    "mipmap-xxxhdpi" = @{ size = 192; fg = 432 };
}

$androidRes = "$rootDir\android\app\src\main\res"

foreach ($m in $mipmaps.Keys) {
    $sz = $mipmaps[$m].size
    $fgSz = $mipmaps[$m].fg
    $dirPath = "$androidRes\$m"
    if (Test-Path $dirPath) {
        # ic_launcher.png (With white/transparent background)
        $ic = Create-LogoImage -targetW $sz -targetH $sz -bgColorHex "#FFFFFF" -paddingPercent 0.12
        $ic.Save("$dirPath\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $ic.Dispose()

        # ic_launcher_round.png
        $icR = Create-LogoImage -targetW $sz -targetH $sz -bgColorHex "#FFFFFF" -paddingPercent 0.12
        $icR.Save("$dirPath\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $icR.Dispose()

        # ic_launcher_foreground.png
        $icFg = Create-LogoImage -targetW $fgSz -targetH $fgSz -bgColorHex "Transparent" -paddingPercent 0.20
        $icFg.Save("$dirPath\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $icFg.Dispose()

        Write-Host "Updated Android $m icons"
    }
}

# --- D. Generate Android Splash Screens (Drawables) ---
$drawableDirs = Get-ChildItem -Path $androidRes -Directory -Filter "drawable*"

foreach ($dDir in $drawableDirs) {
    $splashPath = Join-Path $dDir.FullName "splash.png"
    
    # Determine dimension from existing or defaults
    $w = 512
    $h = 512
    if (Test-Path $splashPath) {
        try {
            $existing = [System.Drawing.Image]::FromFile($splashPath)
            $w = $existing.Width
            $h = $existing.Height
            $existing.Dispose()
        } catch {}
    }

    $bg = if ($dDir.Name -match "night") { "#0F172A" } else { "#0F172A" }
    $sp = Create-LogoImage -targetW $w -targetH $h -bgColorHex $bg -paddingPercent 0.25
    $sp.Save($splashPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $sp.Dispose()
    Write-Host "Updated $($dDir.Name)\splash.png ($w x $h)"
}

# --- E. Generate iOS App Icons & Splash ---
$iosAppIcon = "$rootDir\ios\App\App\Assets.xcassets\AppIcon.appiconset\AppIcon-512@2x.png"
if (Test-Path $iosAppIcon) {
    $iosIcon = Create-LogoImage -targetW 1024 -targetH 1024 -bgColorHex "#FFFFFF" -paddingPercent 0.12
    $iosIcon.Save($iosAppIcon, [System.Drawing.Imaging.ImageFormat]::Png)
    $iosIcon.Dispose()
    Write-Host "Updated iOS AppIcon-512@2x.png"
}

$iosSplashDir = "$rootDir\ios\App\App\Assets.xcassets\Splash.imageset"
if (Test-Path $iosSplashDir) {
    $iosSplashes = Get-ChildItem -Path $iosSplashDir -File -Filter "*.png"
    foreach ($sFile in $iosSplashes) {
        try {
            $ex = [System.Drawing.Image]::FromFile($sFile.FullName)
            $w = $ex.Width
            $h = $ex.Height
            $ex.Dispose()
            
            $bg = if ($sFile.Name -match "dark") { "#0F172A" } else { "#0F172A" }
            $sp = Create-LogoImage -targetW $w -targetH $h -bgColorHex $bg -paddingPercent 0.25
            $sp.Save($sFile.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
            $sp.Dispose()
            Write-Host "Updated iOS splash: $($sFile.Name) ($w x $h)"
        } catch {}
    }
}

$srcImg.Dispose()
Write-Host "All assets generated successfully!"
