# Set Vercel Environments Helper Script for Beteseb (Using Process Timeout Wrapper)
Write-Host "Adding Beteseb environment variables to Vercel..." -ForegroundColor Cyan

$env:VERCEL_TELEMETRY_DISABLED = "1"

$envVars = @{
    "CHAPA_SECRET_KEY" = "CHASECK-0YpzjBjDeNQQ9fLam5V90XjGrnOKvFYN"
    "CHAPA_SUBACCOUNT_ID" = "f3f9f634-15bc-41dd-b262-13067bdb2b73"
    "CHAPA_WEBHOOK_SECRET" = "IB4220kb@907"
    "NEXT_PUBLIC_IPINFO_TOKEN" = "72f607858ba20a"
    "NEXT_PUBLIC_APP_URL" = "https://beteseb.com"
    "ADMIN_SECRET" = "beteseb_admin_secure_2026"
}

$targets = @("production", "preview", "development")

foreach ($key in $envVars.Keys) {
    $val = $envVars[$key]
    foreach ($target in $targets) {
        Write-Host "Adding $key to $target..."
        
        # Start command prompt to execute Vercel CLI
        $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "vercel env add $key $target --value `"$val`" --yes --force" -NoNewWindow -PassThru
        
        # Wait up to 10 seconds for the process to exit
        $proc | Wait-Process -Timeout 10 -ErrorAction SilentlyContinue
        
        if (!$proc.HasExited) {
            Write-Host "Process for $key ($target) timed out. Forcefully terminating..." -ForegroundColor Yellow
            try {
                # Stop the cmd process
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                
                # Also kill any orphaned vercel.exe processes
                $vercelProcs = Get-Process -Name "vercel" -ErrorAction SilentlyContinue
                if ($vercelProcs) {
                    $vercelProcs | Stop-Process -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Host "Failed to stop process: $_" -ForegroundColor Red
            }
        } else {
            Write-Host "Exit Code for $key ($target): $($proc.ExitCode)" -ForegroundColor Green
        }
    }
}

Write-Host "Done adding environment variables!" -ForegroundColor Green
