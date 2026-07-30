Add-Type -AssemblyName System.Drawing
$p1 = "C:\Users\KB\.gemini\antigravity\brain\5ad1ca3c-ac3d-493b-ade5-154c653025cf\.user_uploaded\media__1785403952618.png"
$p2 = "C:\Users\KB\.gemini\antigravity\brain\5ad1ca3c-ac3d-493b-ade5-154c653025cf\.user_uploaded\media__1785404017081.jpg"

$i1 = [System.Drawing.Image]::FromFile($p1)
Write-Host "PNG: $($i1.Width)x$($i1.Height)"
$i1.Dispose()

$i2 = [System.Drawing.Image]::FromFile($p2)
Write-Host "JPG: $($i2.Width)x$($i2.Height)"
$i2.Dispose()
