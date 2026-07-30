Add-Type -AssemblyName System.Drawing
$path = "C:\Users\KB\.gemini\antigravity\brain\5ad1ca3c-ac3d-493b-ade5-154c653025cf\.user_uploaded\media__1785403952618.png"
$bmp = New-Object System.Drawing.Bitmap($path)

$minX = $bmp.Width
$minY = $bmp.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $p = $bmp.GetPixel($x, $y)
        # Check if non-transparent and not pure white if top corners are transparent
        if ($p.A -gt 10) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Bounding box non-transparent: Left=$minX, Top=$minY, Right=$maxX, Bottom=$maxY"
Write-Host "Content dimensions: Width=$($maxX - $minX + 1), Height=$($maxY - $minY + 1)"

$bmp.Dispose()
