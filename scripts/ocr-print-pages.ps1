param(
    [Parameter(Mandatory=$true)][string]$JobsPath,
    [Parameter(Mandatory=$true)][string]$OutputDir
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.FileAccessMode, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapPixelFormat, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrResult, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
[Windows.Globalization.Language, Windows.Globalization, ContentType=WindowsRuntime] | Out-Null
$script:asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
} | Select-Object -First 1
function Await-Result($operation, [Type]$resultType) {
    $task = $script:asTask.MakeGenericMethod($resultType).Invoke($null, @($operation))
    if (-not $task.Wait(60000)) { throw 'Windows OCR operation timed out after 60 seconds' }
    return $task.Result
}
$language = [Windows.Globalization.Language]::new('en-US')
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($language)
if ($null -eq $engine) { throw 'English Windows OCR recognizer unavailable' }
$null = New-Item -ItemType Directory -Force -Path $OutputDir
$jobs = Get-Content -LiteralPath $JobsPath -Raw -Encoding UTF8 | ConvertFrom-Json
$utf8 = New-Object System.Text.UTF8Encoding($false)
foreach ($job in $jobs) {
    if ($job.pageId -notmatch '^[a-zA-Z0-9_-]+$') { throw 'Unsafe page identifier' }
    $target = Join-Path $OutputDir ($job.pageId + '.json')
    $imageHash = (Get-FileHash -LiteralPath $job.imagePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if (Test-Path -LiteralPath $target) {
        $prior = Get-Content -LiteralPath $target -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($prior.imageSha256 -eq $imageHash -and $prior.status -eq 'recognized') { continue }
        throw "Existing OCR result requires explicit review: $target"
    }
    $stream = $null; $bitmap = $null; $gray = $null
    $record = [ordered]@{pageId=$job.pageId; imagePath=$job.imagePath; imageSha256=$imageHash;
        engine='Windows.Media.Ocr'; language='en-US'; osVersion=[Environment]::OSVersion.VersionString;
        processedAt=[DateTime]::UtcNow.ToString('o'); source=$job; confidence=$null;
        reviewStatus='machine-output-unreviewed'; status='pending'}
    try {
        $file = Await-Result ([Windows.Storage.StorageFile]::GetFileFromPathAsync($job.imagePath)) ([Windows.Storage.StorageFile])
        $stream = Await-Result ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
        $decoder = Await-Result ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $bitmap = Await-Result ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
        $gray = [Windows.Graphics.Imaging.SoftwareBitmap]::Convert($bitmap, [Windows.Graphics.Imaging.BitmapPixelFormat]::Gray8)
        $result = Await-Result ($engine.RecognizeAsync($gray)) ([Windows.Media.Ocr.OcrResult])
        $record.text = (($result.Lines | ForEach-Object { $_.Text }) -join "`n")
        $record.lines = @($result.Lines | ForEach-Object {
            @{text=$_.Text; words=@($_.Words | ForEach-Object {
                @{text=$_.Text; x=$_.BoundingRect.X; y=$_.BoundingRect.Y; width=$_.BoundingRect.Width; height=$_.BoundingRect.Height}
            })}
        })
        $record.status = 'recognized'
    } catch {
        $record.status = 'failed'; $record.error = $_.Exception.Message
    } finally {
        if ($null -ne $gray) { $gray.Dispose() }
        if ($null -ne $bitmap) { $bitmap.Dispose() }
        if ($null -ne $stream) { $stream.Dispose() }
    }
    [System.IO.File]::WriteAllText($target, (($record | ConvertTo-Json -Depth 12) + "`n"), $utf8)
    Write-Output ($job.pageId + ' ' + $record.status)
}
