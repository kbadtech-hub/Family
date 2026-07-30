Add-Type -AssemblyName System.Drawing
$path = "C:\Users\KB\.gemini\antigravity\brain\5ad1ca3c-ac3d-493b-ade5-154c653025cf\.user_uploaded\media__1785404017081.jpg"
$bmp = New-Object System.Drawing.Bitmap($path)

Write-Host "JPG Width=$($bmp.Width), Height=$($bmp.Height)"
$bmp.Dispose()
