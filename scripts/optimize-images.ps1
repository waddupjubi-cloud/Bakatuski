param(
  [int[]]$Widths = @(480, 900),
  [long]$MinBytes = 102400,
  [long]$JpegQuality = 90
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$imagesRoot = Join-Path $root "images"
$sourceFolders = @(
  Join-Path $imagesRoot "stories_covers"
  Join-Path $imagesRoot "lores"
  Join-Path $imagesRoot "members"
)
$outputRoot = Join-Path $imagesRoot "optimized"

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" }

$qualityEncoder = [System.Drawing.Imaging.Encoder]::Quality
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter $qualityEncoder, $JpegQuality

function Get-RelativeImagePath([string]$path) {
  $full = [System.IO.Path]::GetFullPath($path)
  $base = [System.IO.Path]::GetFullPath($imagesRoot).TrimEnd('\') + '\'
  return $full.Substring($base.Length)
}

function Save-ResizedJpeg([string]$source, [int]$width) {
  $img = [System.Drawing.Image]::FromFile($source)
  try {
    $targetWidth = [Math]::Min($width, $img.Width)
    $height = [int][Math]::Round($img.Height * ($targetWidth / $img.Width))
    $bitmap = New-Object System.Drawing.Bitmap $targetWidth, $height
    try {
      $bitmap.SetResolution($img.HorizontalResolution, $img.VerticalResolution)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.Clear([System.Drawing.Color]::Black)
        $graphics.DrawImage($img, 0, 0, $targetWidth, $height)
      }
      finally {
        $graphics.Dispose()
      }

      $relative = Get-RelativeImagePath $source
      $relativeNoExt = [System.IO.Path]::ChangeExtension($relative, ".jpg")
      $target = Join-Path (Join-Path $outputRoot $width) $relativeNoExt
      $targetDir = Split-Path $target -Parent
      if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir | Out-Null
      }

      $bitmap.Save($target, $jpegCodec, $encoderParams)
    }
    finally {
      $bitmap.Dispose()
    }
  }
  finally {
    $img.Dispose()
  }
}

$sources = foreach ($folder in $sourceFolders) {
  if (Test-Path $folder) {
    Get-ChildItem $folder -Recurse -File -Include *.png, *.jpg, *.jpeg |
      Where-Object { $_.Length -ge $MinBytes }
  }
}

$created = 0
foreach ($file in $sources) {
  foreach ($width in $Widths) {
    Save-ResizedJpeg $file.FullName $width
    $created++
  }
}

Write-Host "Processed $($sources.Count) source images into $outputRoot"
