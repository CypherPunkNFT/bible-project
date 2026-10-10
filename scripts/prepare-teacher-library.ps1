# Regenerates website data only. Does not run intake, OCR or embedding.
$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path -Parent $PSScriptRoot
$libraryPython = Join-Path (Split-Path -Parent $siteRoot) 'KnowledgeBase\.venv\Scripts\python.exe'
Push-Location $siteRoot
try {
    # The packer migrates an older page-per-file public build if necessary.
    if (-not (Test-Path '.local/teacher-library-unpacked') -and (Test-Path 'public/content/teacher-library/text')) {
        & $libraryPython scripts/pack-teacher-library.py
        if ($LASTEXITCODE) { throw 'Existing-library migration failed.' }
    }
    & $libraryPython scripts/build-acquired-teachers.py
    if ($LASTEXITCODE) { throw 'Catalogue build failed.' }
    & $libraryPython scripts/pack-teacher-library.py
    if ($LASTEXITCODE) { throw 'Reading package build failed.' }
    & node --experimental-strip-types scripts/build-teacher-pages.ts
    if ($LASTEXITCODE) { throw 'Teacher profile generation failed.' }
    & node --experimental-strip-types scripts/build-reading-sources.ts
    if ($LASTEXITCODE) { throw 'Source reading catalogue failed.' }
} finally { Pop-Location }
