# ============================================================
# start-dev.ps1
# Automatiza a configuracao do ambiente de desenvolvimento:
#   1. Inicializa o WSL2 (Ubuntu-24.04)
#   2. Descobre o IP do WSL2
#   3. Descobre o IP Wi-Fi do Windows (usado pelo celular)
#   4. Configura port proxy WSL2 -> Windows nas portas da API
#   5. Libera as portas no Firewall do Windows
#   6. Grava o IP no .env do mobile (EXPO_PUBLIC_API_URL)
#   7. Sobe o Docker Compose no WSL2
#   8. Aguarda a API responder (health check)
#   9. Inicia o Expo com --dev-client
#
# EXECUCAO: abra o PowerShell como Administrador e rode:
#   .\start-dev.ps1
# ============================================================

param(
  [int[]]$Ports            = @(3000, 8082),
  [string]$WslProjectPath  = "/home/andre/snap-price",
  [string]$WifiInterface   = "Wi-Fi",
  [string]$WslDistro       = "Ubuntu-24.04",
  [int]$MetroPort          = 8082
)

$ErrorActionPreference = "SilentlyContinue"

function Write-Step($msg) { Write-Host "`n$msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  WARN $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  FAIL $msg" -ForegroundColor Red }

# Roda comando no WSL sempre na distro correta
function Invoke-Wsl([string]$cmd) {
  wsl -d $WslDistro -e sh -c $cmd 2>&1
}

# ------------------------------------------------------------
# 1. Verifica Admin
# ------------------------------------------------------------
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
  Write-Fail "Execute o PowerShell como Administrador para configurar portproxy e firewall."
  exit 1
}

# ------------------------------------------------------------
# 2. Inicializa o WSL2 (boot rapido)
# ------------------------------------------------------------
Write-Step "Inicializando WSL2 ($WslDistro)..."
wsl -d $WslDistro echo "ok" | Out-Null
Start-Sleep -Seconds 1
Write-Ok "WSL2 ($WslDistro) inicializado"

# ------------------------------------------------------------
# 3. IP do WSL2
# ------------------------------------------------------------
Write-Step "Obtendo IP do WSL2..."
$wslIp = $null

# Metodo 1: hostname -I na distro correta
try {
  $raw = wsl -d $WslDistro hostname -I 2>$null
  if ($raw) {
    $wslIp = $raw.Trim().Split(" ") | Where-Object { $_ -match "^\d+\.\d+\.\d+\.\d+$" } | Select-Object -First 1
  }
} catch {}

# Metodo 2: ip addr via sh na distro correta
if (-not $wslIp) {
  try {
    $raw = Invoke-Wsl "ip addr show eth0 | grep 'inet ' | awk '{print \$2}' | cut -d'/' -f1"
    if ($raw) { $wslIp = $raw.Trim() }
  } catch {}
}

# Metodo 3: estima pelo gateway vEthernet (WSL)
if (-not $wslIp) {
  try {
    $vEth = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "vEthernet (WSL)" -ErrorAction Stop
    $parts = $vEth.IPAddress.Split(".")
    $parts[3] = "2"
    $wslIp = $parts -join "."
    Write-Warn "IP obtido via vEthernet (estimado): $wslIp"
  } catch {}
}

if (-not $wslIp) {
  Write-Fail "Nao foi possivel obter o IP do WSL2. Verifique se a distro '$WslDistro' esta rodando."
  exit 1
}
Write-Ok "WSL2 IP: $wslIp"

# ------------------------------------------------------------
# 4. IP Wi-Fi do Windows (visivel ao celular na rede local)
# ------------------------------------------------------------
Write-Step "Obtendo IP Windows na rede local..."
$winIp = $null

try {
  $winIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias $WifiInterface -ErrorAction Stop).IPAddress
  Write-Ok "Windows IP ($WifiInterface): $winIp"
} catch {
  $winIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" -and $_.IPAddress -notlike "172.*" } |
    Select-Object -First 1).IPAddress

  if (-not $winIp) {
    Write-Fail "Nao foi possivel obter o IP do Windows. Verifique se esta conectado ao Wi-Fi."
    exit 1
  }
  Write-Warn "Interface '$WifiInterface' nao encontrada. Usando IP: $winIp"
  Write-Warn "Para fixar, rode: Get-NetIPAddress -AddressFamily IPv4"
  Write-Warn "Depois passe: .\start-dev.ps1 -WifiInterface 'NomeDaInterface'"
}

# ------------------------------------------------------------
# 5. Port proxy + Firewall (3000 = API, 8082 = Metro bundler)
# ------------------------------------------------------------
Write-Step "Configurando port proxy e firewall para portas: $($Ports -join ', ')..."
foreach ($port in $Ports) {
  netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 | Out-Null
  netsh interface portproxy add v4tov4 `
    listenport=$port listenaddress=0.0.0.0 `
    connectport=$port connectaddress=$winIp | Out-Null

  $ruleName = "WSL2-SnapPrice-$port"
  netsh advfirewall firewall delete rule name=$ruleName | Out-Null
  netsh advfirewall firewall add rule `
    name=$ruleName dir=in action=allow protocol=TCP localport=$port | Out-Null

  Write-Ok "Porta ${port}: aberta no firewall"
}

# ------------------------------------------------------------
# 6. Grava apps/mobile/.env
# ------------------------------------------------------------
Write-Step "Atualizando apps/mobile/.env com EXPO_PUBLIC_API_URL..."
$envPath    = Join-Path $PSScriptRoot "apps\mobile\.env"
$apiUrl     = "http://${winIp}:3000"
$envContent = "# Gerado automaticamente por start-dev.ps1`nEXPO_PUBLIC_API_URL=$apiUrl`n"
Set-Content -Path $envPath -Value $envContent -Encoding UTF8
Write-Ok "EXPO_PUBLIC_API_URL=$apiUrl -> $envPath"

# ------------------------------------------------------------
# 7. Sobe Docker Compose no WSL2
# ------------------------------------------------------------
Write-Step "Subindo Docker Compose em ${WslProjectPath}/apps/api ..."
$out = Invoke-Wsl "cd '$WslProjectPath/apps/api' && docker compose up -d"
Write-Host ($out | Out-String).Trim()
Write-Ok "Docker Compose iniciado"

# ------------------------------------------------------------
# 8. Health check (40 tentativas = ~80s)
# ------------------------------------------------------------
Write-Step "Aguardando API em ${apiUrl}/health ..."
$maxTries = 40
$attempt  = 0
$ready    = $false
while ($attempt -lt $maxTries -and -not $ready) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri "$apiUrl/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($r.StatusCode -eq 200) { $ready = $true }
  } catch {}
  $attempt++
  Write-Host "  Tentativa $attempt/$maxTries..." -ForegroundColor DarkGray
}

if (-not $ready) {
  Write-Warn "API nao respondeu em 80s. Verifique os logs com:"
  Write-Warn "  wsl -d $WslDistro -e sh -c 'cd $WslProjectPath/apps/api && docker compose logs api'"
} else {
  Write-Ok "API respondendo em $apiUrl"
}

# ------------------------------------------------------------
# 9. Expo (porta 8082 para evitar conflito com svchost na 8081)
# ------------------------------------------------------------
Write-Step "Iniciando Expo..."
Write-Host "`n  >>> API:    http://${winIp}:3000 <<<" -ForegroundColor Yellow
Write-Host   "  >>> Metro:  http://${winIp}:${MetroPort} <<<" -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "apps\mobile")
npx expo start --dev-client --port $MetroPort
