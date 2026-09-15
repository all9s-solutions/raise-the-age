param(
  [Parameter(Mandatory=$true)]
  [string]$Id,

  [Parameter(Mandatory=$true)]
  [string]$Name,

  [Parameter(Mandatory=$false)]
  [string]$BeforeImage,

  [Parameter(Mandatory=$true)]
  [string]$CurrentImage,

  [int]$MaxWidth = 1200
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root "assets\images\people"
New-Item -ItemType Directory -Force -Path $destination | Out-Null

function Save-ResizedJpeg {
  param(
    [string]$Source,
    [string]$Target,
    [int]$Width
  )

  $image = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $Source))
  try {
    try {
      $orientation = $image.GetPropertyItem(274).Value[0]
      switch ($orientation) {
        3 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        6 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        8 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
      }
    } catch {
      # Some images do not include EXIF orientation data.
    }

    $ratio = [Math]::Min(1.0, [double]$Width / [double]$image.Width)
    $newWidth = [int][Math]::Round($image.Width * $ratio)
    $newHeight = [int][Math]::Round($image.Height * $ratio)
    $bitmap = New-Object System.Drawing.Bitmap $newWidth, $newHeight
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($image, 0, 0, $newWidth, $newHeight)

        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
          Where-Object { $_.MimeType -eq "image/jpeg" }
        $encoder = [System.Drawing.Imaging.Encoder]::Quality
        $params = New-Object System.Drawing.Imaging.EncoderParameters 1
        $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter $encoder, 82L
        $bitmap.Save($Target, $codec, $params)
      } finally {
        $graphics.Dispose()
      }
    } finally {
      $bitmap.Dispose()
    }
  } finally {
    $image.Dispose()
  }
}

$beforeOut = Join-Path $destination "$Id-before.jpg"
$currentOut = Join-Path $destination "$Id-current.jpg"

if ($BeforeImage) {
  Save-ResizedJpeg -Source $BeforeImage -Target $beforeOut -Width $MaxWidth
}
Save-ResizedJpeg -Source $CurrentImage -Target $currentOut -Width $MaxWidth

$entry = [ordered]@{
  id = $Id
  name = $Name
  beforeImage = if ($BeforeImage) { "assets/images/people/$Id-before.jpg" } else { "" }
  currentImage = "assets/images/people/$Id-current.jpg"
  age = $null
  yearsServed = $null
  county = ""
  facility = ""
  summary = ""
  accomplishments = @()
  reviewReason = ""
  tags = @()
}

$entry | ConvertTo-Json -Depth 5
