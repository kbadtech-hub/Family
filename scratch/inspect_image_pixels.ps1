Add-Type -AssemblyName System.Drawing
$path = "C:\Users\KB\.gemini\antigravity\brain\5ad1ca3c-ac3d-493b-ade5-154c653025cf\.user_uploaded\media__1785403952618.png"
$bmp = [System.Drawing.Bitmap]::FromFile($path)
Write-Host "Width: $($bmp.Width), Height: $($bmp.Height), PixelFormat: $($bmp.PixelFormat)"
$topRight = $bmp.GetPixel($bmp.Width - 5, 5)
$topLeft = $bmp.GetPixel(5, 5)
$center = $bmp.GetPixel([int]($bmp.Width / 2), [int]($bmp.Height / 2))
Write-Host "TopLeft Pixel: ARGB=($($topLeft.A),$($topLeft.R),$($topLeft.G),$($topLeft.B))"
Write-Host "TopRight Pixel: ARGB=($($topRight.A),$($topRight.R),$($topRight.G),$($topRight.B))"
Write-Host "Center Pixel: ARGB=($($center.A),$($center.R),$($center.G),$($center.B))"
$bmp.Dispose()
