param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [int]$TransparentThreshold = 42,
  [int]$OpaqueThreshold = 170
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if ($OpaqueThreshold -le $TransparentThreshold) {
  throw "OpaqueThreshold must be greater than TransparentThreshold."
}

$sourcePath = (Resolve-Path -LiteralPath $InputPath).Path
$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = [System.IO.Path]::GetDirectoryName($outputFullPath)
if ($outputDirectory) {
  [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
}

$source = [System.Drawing.Bitmap]::new($sourcePath)
$bitmap = [System.Drawing.Bitmap]::new(
  $source.Width,
  $source.Height,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.DrawImageUnscaled($source, 0, 0)
$graphics.Dispose()
$source.Dispose()

$sampleStep = [Math]::Max(1, [Math]::Floor([Math]::Min($bitmap.Width, $bitmap.Height) / 128))
$samples = [System.Collections.Generic.List[System.Drawing.Color]]::new()
for ($x = 0; $x -lt $bitmap.Width; $x += $sampleStep) {
  $samples.Add($bitmap.GetPixel($x, 0))
  $samples.Add($bitmap.GetPixel($x, $bitmap.Height - 1))
}
for ($y = 0; $y -lt $bitmap.Height; $y += $sampleStep) {
  $samples.Add($bitmap.GetPixel(0, $y))
  $samples.Add($bitmap.GetPixel($bitmap.Width - 1, $y))
}
$keyR = [Math]::Round(($samples | Measure-Object -Property R -Average).Average)
$keyG = [Math]::Round(($samples | Measure-Object -Property G -Average).Average)
$keyB = [Math]::Round(($samples | Measure-Object -Property B -Average).Average)

$rect = [System.Drawing.Rectangle]::new(0, 0, $bitmap.Width, $bitmap.Height)
$data = $bitmap.LockBits(
  $rect,
  [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$bytes = [byte[]]::new([Math]::Abs($data.Stride) * $bitmap.Height)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

for ($y = 0; $y -lt $bitmap.Height; $y += 1) {
  for ($x = 0; $x -lt $bitmap.Width; $x += 1) {
    $index = $y * $data.Stride + $x * 4
    $blue = [int]$bytes[$index]
    $green = [int]$bytes[$index + 1]
    $red = [int]$bytes[$index + 2]
    $distance = [Math]::Sqrt(
      [Math]::Pow($red - $keyR, 2) +
      [Math]::Pow($green - $keyG, 2) +
      [Math]::Pow($blue - $keyB, 2)
    )
    if ($distance -le $TransparentThreshold) {
      $alpha = 0
    } elseif ($distance -ge $OpaqueThreshold) {
      $alpha = 255
    } else {
      $alpha = [Math]::Round(255 * ($distance - $TransparentThreshold) / ($OpaqueThreshold - $TransparentThreshold))
    }
    $edgeRatio = 1 - $alpha / 255
    $spill = [Math]::Max(0, [Math]::Min($red, $blue) - $green)
    $bytes[$index] = [Math]::Max(0, [Math]::Round($blue - $spill * $edgeRatio))
    $bytes[$index + 2] = [Math]::Max(0, [Math]::Round($red - $spill * $edgeRatio))
    $bytes[$index + 3] = $alpha
  }
}

[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
$bitmap.UnlockBits($data)
$bitmap.Save($outputFullPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()

Write-Output "key=$keyR,$keyG,$keyB output=$outputFullPath"
