# AssetTracer - Database Migration Script
# Run all essential migrations in the correct order

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     AssetTracer Database Migration Script                    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "This script will list all migrations in the correct order." -ForegroundColor Yellow
Write-Host "Copy the contents of each file and run them in your Supabase SQL Editor.`n" -ForegroundColor Yellow

# Define migrations in order
$migrations = @(
    @{
        Section = "1. BASE SCHEMA"
        Files = @(
            "asset-tracer\supabase\tables-schema.sql",
            "asset-tracer\supabase\functions.sql"
        )
    },
    @{
        Section = "2. USER & ORGANIZATION SETUP"
        Files = @(
            "asset-tracer\supabase\SETUP-USER-ORG.sql",
            "asset-tracer\supabase\CREATE-USER-TRIGGER-V2.sql"
        )
    },
    @{
        Section = "3. ASSET FEATURES"
        Files = @(
            "asset-tracer\supabase\FIX-ASSETS-SCHEMA.sql",
            "asset-tracer\supabase\add-created-by-to-assets.sql"
        )
    },
    @{
        Section = "4. USER & COMPANY PROFILES"
        Files = @(
            "asset-tracer\supabase\ADD-USER-PHONE.sql",
            "asset-tracer\supabase\ADD-COMPANY-PROFILE-FIELDS.sql",
            "asset-tracer\supabase\CREATE-COMPANY-LOGOS-BUCKET.sql"
        )
    },
    @{
        Section = "5. PAYMENT & SETTINGS"
        Files = @(
            "asset-tracer\supabase\ADD-PAYMENT-COLUMNS.sql",
            "asset-tracer\supabase\ADD-ORGANIZATION-SETTINGS.sql"
        )
    },
    @{
        Section = "6. QUOTATIONS SYSTEM"
        Files = @(
            "asset-tracer\supabase\CREATE-QUOTATIONS-TABLES.sql",
            "asset-tracer\supabase\ADD-ASSET-ID-TO-QUOTATION-ITEMS.sql",
            "asset-tracer\supabase\ADD-CONVERTED-TO-INVOICE-COLUMN.sql",
            "asset-tracer\supabase\ADD-SUBJECT-FIELDS.sql",
            "asset-tracer\supabase\ADD-DEFAULT-NOTES-AND-TERMS.sql",
            "asset-tracer\supabase\ADD-INVOICED-STATUS-TO-QUOTATIONS.sql"
        )
    },
    @{
        Section = "7. SUBSCRIPTION & BILLING"
        Files = @(
            "COMPLETE-POLAR-MIGRATION.sql",
            "ADD-EMAIL-NOTIFICATIONS.sql"
        )
    },
    @{
        Section = "8. TEAM MANAGEMENT"
        Files = @(
            "asset-tracer\supabase\ADD-TEAM-MANAGEMENT.sql"
        )
    }
)

$totalFiles = 0
foreach ($section in $migrations) {
    $totalFiles += $section.Files.Count
}

Write-Host "Total migrations to run: $totalFiles`n" -ForegroundColor Green

$counter = 1
foreach ($section in $migrations) {
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host $section.Section -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
    
    foreach ($file in $section.Files) {
        $fullPath = Join-Path $PSScriptRoot $file
        
        if (Test-Path $fullPath) {
            Write-Host "  [$counter/$totalFiles] ✓ $file" -ForegroundColor Green
            $counter++
        } else {
            Write-Host "  [$counter/$totalFiles] ✗ $file (NOT FOUND)" -ForegroundColor Red
            $counter++
        }
    }
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "1. Go to your Supabase project: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Click 'SQL Editor' in the left sidebar" -ForegroundColor White
Write-Host "3. For each file above (in order):" -ForegroundColor White
Write-Host "   a. Open the file in VS Code" -ForegroundColor Gray
Write-Host "   b. Copy all contents (Ctrl+A, Ctrl+C)" -ForegroundColor Gray
Write-Host "   c. Paste into Supabase SQL Editor" -ForegroundColor Gray
Write-Host "   d. Click 'Run' button" -ForegroundColor Gray
Write-Host "   e. Verify it succeeds (green checkmark)" -ForegroundColor Gray
Write-Host "4. Repeat for all files in order`n" -ForegroundColor White

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "VERIFICATION:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "After running all migrations, verify your setup:" -ForegroundColor White
Write-Host "  • Run: asset-tracer\supabase\check-schema.sql" -ForegroundColor Gray
Write-Host "  • Run: asset-tracer\supabase\VERIFY-TRIGGER.sql" -ForegroundColor Gray
Write-Host "  • Run: asset-tracer\supabase\VERIFY-QUOTATIONS-SETUP.sql`n" -ForegroundColor Gray

Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "💡 TIP: For complete reference, see MIGRATION-INDEX.md`n" -ForegroundColor Cyan

Write-Host "Press any key to open the first migration file..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open first file
$firstFile = Join-Path $PSScriptRoot $migrations[0].Files[0]
if (Test-Path $firstFile) {
    Start-Process $firstFile
    Write-Host "`n✅ Opened: $($migrations[0].Files[0])" -ForegroundColor Green
} else {
    Write-Host "`n❌ Could not find first migration file" -ForegroundColor Red
}

Write-Host "`nGood luck with your deployment! 🚀`n" -ForegroundColor Green

