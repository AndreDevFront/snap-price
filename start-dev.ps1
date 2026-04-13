# ============================================================
# start-dev.ps1
# Automatiza a configuracao do ambiente de desenvolvimento:
#   1. Descobre o IP do WSL2
#   2. Descobre o IP Wi-Fi do Windows (usado pelo celular)
#   3. Configura port proxy WSL2 -> Windows nas portas da API
#   4. Libera as portas no Firewall do Windows
#   5. Grava o IP no .env do mobile (EXPO_PUBLIC_API_URL)
#   6. Sobe o Docker Compose no WSL2
#   7. Aguarda a API responder (health check)
#   8. Inicia o Expo com --dev-client
#
# EXECUCAO: abra o PowerShell como Administrador e rode:
#   .\start-dev.ps1
# ============================================================

param(
  # Portas expostas pelo Docker Compose da API
  [int[]]$Ports = @(3000),

  # Caminho do projeto dentro do WSL2 (distro padrao)
  [string]$WslProjectPath = "/mnt/c/Users/$env:USERNAME/snap-price",

  # Interface de rede Wi-Fi (ajuste se o nome for diferente)
  [string]$WifiInterface = "Wi-Fi"
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "`n$msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  WARN $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  FAIL $msg" -ForegroundColor Red }

# ------------------------------------------------------------
# 1. Verifica se esta rodando como Admin
# ------------------------------------------------------------
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
  Write-Fail "Execute o PowerShell como Administrador para configurar portproxy e firewall."
  exit 1
}

# ------------------------------------------------------------
# 2. IP do WSL2
# ------------------------------------------------------------
Write-Step "Obtendo IP do WSL2..."
$wslIp = (wsl hostname -I 2>$null).Trim().Split(" ")[0]
if (-not $wslIp) {
  Write-Fail "Nao foi possivel obter o IP do WSL2. Verifique se o WSL2 esta rodando."
  exit 1
}
Write-Ok "WSL2 IP: $wslIp"

# ------------------------------------------------------------
# 3. IP Wi-Fi do Windows (visivel na rede local / celular)
# ------------------------------------------------------------
Write-Step "Obtendo IP Wi-Fi do Windows..."
try {
  $winIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias $WifiInterface -ErrorAction Stop).IPAddress
  Write-Ok "Windows IP ($WifiInterface): $winIp"
} catch {
  # Fallback: tenta qualquer interface ativa que nao seja loopback
  $winIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } |
    Select-Object -First 1).IPAddress
  if (-not $winIp) {
    Write-Fail "Nao foi possivel obter o IP da maquina Windows. Conecte ao Wi-Fi."
    exit 1
  }
  Write-Warn "Interface '$WifiInterface' nao encontrada. Usando IP: $winIp"
}

# ------------------------------------------------------------
# 4. Port proxy e Firewall
# ------------------------------------------------------------
Write-Step "Configurando port proxy e firewall para as portas: $($Ports -join ', ')..."
foreach ($port in $Ports) {
  # Remove regra antiga (ignora erros se nao existir)
  netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 2>$null | Out-Null
  netsh interface portproxy add    v4tov4 `
    listenport=$port listenaddress=0.0.0.0 `
    connectport=$port connectaddress=$wslIp | Out-Null

  $ruleName = "WSL2-SnapPrice-$port"
  netsh advfirewall firewall delete rule name=$ruleName 2>$null | Out-Null
  netsh advfirewall firewall add rule `
    name=$ruleName dir=in action=allow protocol=TCP localport=$port | Out-Null

  Write-Ok "Porta $port redirecionada ($wslIp -> 0.0.0.0) e firewall liberado"
}

# ------------------------------------------------------------
# 5. Grava o .env do mobile com o IP correto
# ------------------------------------------------------------
Write-Step "Atualizando apps/mobile/.env com EXPO_PUBLIC_API_URL..."
$envPath = Join-Path $PSScriptRoot "apps\mobile\.env"
$apiUrl  = "http://${winIp}:3000"
$envContent = "# Gerado automaticamente por start-dev.ps1`nEXPO_PUBLIC_API_URL=$apiUrl`n"
Set-Content -Path $envPath -Value $envContent -Encoding UTF8
Write-Ok "EXPO_PUBLIC_API_URL=$apiUrl gravado em $envPath"

# ------------------------------------------------------------
# 6. Sobe o Docker Compose no WSL2
# ------------------------------------------------------------
Write-Step "Subindo Docker Compose no WSL2 ($WslProjectPath)..."
$dockerCmd = "cd '$WslProjectPath/apps/api' && docker compose up -d 2>&1"
$output = wsl bash -c $dockerCmd
Write-Host $output
Write-Ok "Docker Compose iniciado"

# ------------------------------------------------------------
# 7. Health check da API
# ------------------------------------------------------------
Write-Step "Aguardando a API responder em $apiUrl/health..."
$maxTries = 20
$try = 0
$ready = $false
while ($try -lt $maxTries -and -not $ready) {
  Start-Sleep -Seconds 2
  try {
    $resp = Invoke-WebRequest -Uri "$apiUrl/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($resp.StatusCode -eq 200) { $ready = $true }
  } catch { }
  $try++
  Write-Host "  Tentativa $try/$maxTries..." -ForegroundColor DarkGray
}

if (-not $ready) {
  Write-Warn "API nao respondeu em ${maxTries}x2s. Verifique os logs: wsl bash -c 'cd $WslProjectPath/apps/api && docker compose logs -f'"
} else {
  Write-Ok "API respondendo em $apiUrl"
}

# ------------------------------------------------------------
# 8. Inicia o Expo
# ------------------------------------------------------------
Write-Step "Iniciando Expo (--dev-client)..."
Write-Host "`n  IP para configurar no celular: $apiUrl" -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "apps\mobile")
npx expo start --dev-client
