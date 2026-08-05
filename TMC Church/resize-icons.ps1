Add-Type -AssemblyName System.Drawing

$srcPath = 'LOGO TMC.png'
$originalImage = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath).Path)

$sizes = @(180, 192, 512)

foreach ($size in $sizes) {
    $outputPath = "icon-$size.png"
    
    $resized = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($resized)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::White)
    
    $scale = [Math]::Min($size / $originalImage.Width, $size / $originalImage.Height)
    $newWidth = [int]($originalImage.Width * $scale)
    $newHeight = [int]($originalImage.Height * $scale)
    $x = ($size - $newWidth) / 2
    $y = ($size - $newHeight) / 2
    
    $graphics.DrawImage($originalImage, $x, $y, $newWidth, $newHeight)
    $graphics.Dispose()
    
    $resized.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()
    Write-Host "Created $outputPath ($size x $size)"
}

$originalImage.Dispose()
Write-Host "Done resizing icons from LOGO TMC.png"
