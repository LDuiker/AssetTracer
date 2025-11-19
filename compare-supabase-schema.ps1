<#
 .SYNOPSIS
  Compare Supabase staging vs production schema (DDL) and RLS policies.

 .DESCRIPTION
  This script dumps the specified Postgres schema from both Supabase projects,
  compares the DDL outputs, and fetches row-level security policies for a
  side-by-side diff. Differences are written to the console and saved under an
  output directory for later review.

 .EXAMPLE
  ./compare-supabase-schema.ps1 `
    -StagingUri "postgres://postgres:password@db.ldomlpcofqyoynvlyvau.supabase.co:5432/postgres" `
    -ProductionUri "postgres://postgres:password@db.ftelnmursmitpjwjbyrw.supabase.co:5432/postgres"

 .REQUIREMENTS
  - psql and pg_dump available on PATH (install via Supabase CLI, Postgres, or Homebrew/Git Bash).
  - PowerShell 5.1+ or PowerShell Core.
  - Network access to both Supabase databases.
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$StagingUri,

  [Parameter(Mandatory = $true)]
  [string]$ProductionUri,

  [Parameter()]
  [string]$Schema = "public",

  [Parameter()]
  [string]$OutputDir = "$(Get-Location)\supabase-schema-compare"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-Executable {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CommandName
  )

  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "Required executable '$CommandName' was not found on PATH. Install it and re-run the script."
  }
}

Test-Executable -CommandName "psql"
Test-Executable -CommandName "pg_dump"

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
$stagingSchemaFile = Join-Path $OutputDir "staging-schema-$timestamp.sql"
$productionSchemaFile = Join-Path $OutputDir "production-schema-$timestamp.sql"
$schemaDiffFile = Join-Path $OutputDir "schema-diff-$timestamp.txt"
$stagingPolicyFile = Join-Path $OutputDir "staging-rls-$timestamp.txt"
$productionPolicyFile = Join-Path $OutputDir "production-rls-$timestamp.txt"
$policyDiffFile = Join-Path $OutputDir "rls-diff-$timestamp.txt"

$env:PGSSLMODE = "require"

Write-Host "Dumping schema for schema '$Schema'..." -ForegroundColor Cyan

$dumpArgs = @("--schema=$Schema", "--schema-only", "--no-owner", "--no-privileges", "--quote-all-identifiers")

& pg_dump @dumpArgs --file=$stagingSchemaFile $StagingUri
Write-Host "  ✔ Staging schema saved to $stagingSchemaFile"

& pg_dump @dumpArgs --file=$productionSchemaFile $ProductionUri
Write-Host "  ✔ Production schema saved to $productionSchemaFile"

function Compare-Files {
  param(
    [Parameter(Mandatory = $true)]
    [string]$LeftPath,
    [Parameter(Mandatory = $true)]
    [string]$RightPath,
    [Parameter(Mandatory = $true)]
    [string]$Label,
    [Parameter(Mandatory = $true)]
    [string]$DiffOutputPath
  )

  $leftContent = Get-Content $LeftPath
  $rightContent = Get-Content $RightPath

  $diff = Compare-Object -ReferenceObject $leftContent -DifferenceObject $rightContent -SyncWindow 3

  if ($diff) {
    $diff |
      ForEach-Object {
        "{0} {1}" -f $_.SideIndicator, $_.InputObject
      } | Out-File -FilePath $DiffOutputPath -Encoding UTF8

    Write-Warning "$Label differ. Review $DiffOutputPath for details."
  }
  else {
    Out-File -FilePath $DiffOutputPath -Encoding UTF8 -InputObject ""  # ensure file exists
    Write-Host "$Label match." -ForegroundColor Green
  }
}

Write-Host "Comparing schema dumps..." -ForegroundColor Cyan
Compare-Files -LeftPath $productionSchemaFile -RightPath $stagingSchemaFile -Label "Schemas" -DiffOutputPath $schemaDiffFile

$policyQuery = @"
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  COALESCE(qual, '<null>') AS qual,
  COALESCE(with_check, '<null>') AS with_check,
  definition
FROM pg_policies
WHERE schemaname = '$Schema'
ORDER BY tablename, policyname;
"@

Write-Host "Exporting RLS policies..." -ForegroundColor Cyan

& psql $StagingUri -v "ON_ERROR_STOP=1" -P "footer=off" -A -F "|" -q -X -c $policyQuery | Out-File -FilePath $stagingPolicyFile -Encoding UTF8
Write-Host "  ✔ Staging policies saved to $stagingPolicyFile"

& psql $ProductionUri -v "ON_ERROR_STOP=1" -P "footer=off" -A -F "|" -q -X -c $policyQuery | Out-File -FilePath $productionPolicyFile -Encoding UTF8
Write-Host "  ✔ Production policies saved to $productionPolicyFile"

Write-Host "Comparing RLS policies..." -ForegroundColor Cyan
Compare-Files -LeftPath $productionPolicyFile -RightPath $stagingPolicyFile -Label "RLS policies" -DiffOutputPath $policyDiffFile

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Schema diff:      $schemaDiffFile"
Write-Host "  RLS policy diff:  $policyDiffFile"
Write-Host ""
Write-Host "If both diff files are empty, staging mirrors production. Otherwise review the diff files for discrepancies."

