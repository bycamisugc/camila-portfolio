# Comprime vídeos para o site usando o conversor nativo do Windows (Media Foundation), sem instalar nada.
# Saída: MP4 H.264, lado maior 1280px, ~2,2 Mbps (bom para vídeo vertical no celular).
# Uso: powershell -File scripts\comprimir-video.ps1 -Entrada "C:\...\video.mov" -Saida "novo\videos\nome.mp4"
param(
  [Parameter(Mandatory = $true)][string]$Entrada,
  [Parameter(Mandatory = $true)][string]$Saida,
  [int]$Bitrate = 2200000,
  [int]$LadoMaior = 1280
)

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Transcoding.MediaTranscoder, Windows.Media.Transcoding, ContentType = WindowsRuntime]
$null = [Windows.Media.MediaProperties.MediaEncodingProfile, Windows.Media.MediaProperties, ContentType = WindowsRuntime]

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
$asTaskProgress = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncActionWithProgress`1' })[0]

function Await($op, [Type]$tipo) {
  $t = $asTaskGeneric.MakeGenericMethod($tipo).Invoke($null, @($op))
  $t.Wait(-1) | Out-Null
  $t.Result
}
function AwaitProgress($op) {
  $t = $asTaskProgress.MakeGenericMethod([double]).Invoke($null, @($op))
  $t.Wait(-1) | Out-Null
}

$inPath = (Resolve-Path $Entrada).Path
$outDir = Split-Path -Parent ([System.IO.Path]::GetFullPath($Saida))
New-Item -ItemType Directory -Force $outDir | Out-Null
$outName = Split-Path -Leaf $Saida

$src = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($inPath)) ([Windows.Storage.StorageFile])
$folder = Await ([Windows.Storage.StorageFolder]::GetFolderFromPathAsync($outDir)) ([Windows.Storage.StorageFolder])
$dst = Await ($folder.CreateFileAsync($outName, [Windows.Storage.CreationCollisionOption]::ReplaceExisting)) ([Windows.Storage.StorageFile])

$orig = Await ([Windows.Media.MediaProperties.MediaEncodingProfile]::CreateFromFileAsync($src)) ([Windows.Media.MediaProperties.MediaEncodingProfile])
$w = [double]$orig.Video.Width; $h = [double]$orig.Video.Height
$esc = [math]::Min(1.0, $LadoMaior / [math]::Max($w, $h))
$nw = [int]([math]::Round($w * $esc / 2) * 2); $nh = [int]([math]::Round($h * $esc / 2) * 2)

$perfil = [Windows.Media.MediaProperties.MediaEncodingProfile]::CreateMp4([Windows.Media.MediaProperties.VideoEncodingQuality]::HD720p)
$perfil.Video.Width = $nw
$perfil.Video.Height = $nh
$perfil.Video.Bitrate = $Bitrate
if ($orig.Video.FrameRate.Numerator -gt 0) {
  $perfil.Video.FrameRate.Numerator = $orig.Video.FrameRate.Numerator
  $perfil.Video.FrameRate.Denominator = $orig.Video.FrameRate.Denominator
}
$perfil.Audio.Bitrate = 128000

$tr = New-Object Windows.Media.Transcoding.MediaTranscoder
$tr.HardwareAccelerationEnabled = $true
$prep = Await ($tr.PrepareFileTranscodeAsync($src, $dst, $perfil)) ([Windows.Media.Transcoding.PrepareTranscodeResult])
if (-not $prep.CanTranscode) { throw "Nao foi possivel converter: $($prep.FailureReason)" }
AwaitProgress ($prep.TranscodeAsync())

$final = Get-Item ([System.IO.Path]::Combine($outDir, $outName))
"{0}  {1}x{2} -> {3}x{4}  {5:N1}MB -> {6:N1}MB" -f $outName, $w, $h, $nw, $nh, ((Get-Item $inPath).Length / 1MB), ($final.Length / 1MB)
