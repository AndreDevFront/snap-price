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
#   .\start-dev.ps1 -WslProjectPath "/home/andre/snap-price"
# ============================================================

param(
  [int[]]$Ports = @(3000),
  [string]$WslProjectPath = "/home/andre/snap-price",
  [string]$WifiInterface = "Wi-Fi"
)

$ErrorActionPreference = "SilentlyContinue"

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
# 2. IP do WSL2 — tenta 3 metodos diferentes
# ------------------------------------------------------------
Write-Step "Obtendo IP do WSL2..."

$wslIp = $null

# Metodo 1: hostname -I
try {
  $raw = wsl hostname -I 2>$null
  if ($raw) { $wslIp = $raw.Trim().Split(" ") | Where-Object { $_ -match "^\d+\.\d+\.\d+\.\d+$" } | Select-Object -First 1 }
} catch {}

# Metodo 2: ip route
if (-not $wslIp) {
  try {
    $raw = wsl bash -c "ip addr show eth0 | grep 'inet ' | awk '{print \$2}' | cut -d'/' -f1" 2>$null
    if ($raw) { $wslIp = $raw.Trim() }
  } catch {}
}

# Metodo 3: le do registro do Windows (vEthernet WSL)
if (-not $wslIp) {
  try {
    $vEth = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "vEthernet (WSL)" -ErrorAction Stop
    # O IP do WSL2 fica na mesma subnet, ultimo octeto .1 -> host; .2 geralmente eh o WSL
    $parts = $vEth.IPAddress.Split(".")
    $parts[3] = "2"
    $wslIp = $parts -join "."
    Write-Warn "IP obtido via vEthernet (estimado): $wslIp"
  } catch {}
}

if (-not $wslIp) {
  Write-Fail "Nao foi possivel obter o IP do WSL2."
  Write-Fail "Verifique se o WSL2 esta rodando: abra o terminal WSL e tente novamente."
  exit 1
}
Write-Ok "WSL2 IP: $wslIp"

# ------------------------------------------------------------
# 3. IP Wi-Fi do Windows (visivel na rede local / celular)
# ------------------------------------------------------------
Write-Step "Obtendo IP Windows na rede local..."
$winIp = $null

try {
  $winIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias $WifiInterface -ErrorAction Stop).IPAddress
  Write-Ok "Windows IP ($WifiInterface): $winIp"
} catch {
  # Fallback: qualquer interface ativa, exceto loopback e link-local
  $winIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" -and $_.IPAddress -notlike "172.*" } |
    Select-Object -First 1).IPAddress

  if (-not $winIp) {
    Write-Fail "Nao foi possivel obter o IP do Windows. Verifique se esta conectado ao Wi-Fi."
    exit 1
  }
  Write-Warn "Interface '$WifiInterface' nao encontrada. Usando IP: $winIp"
  Write-Warn "Para fixar a interface correta, rode: Get-NetIPAddress -AddressFamily IPv4"
  Write-Warn "Depois passe o nome correto: .\start-dev.ps1 -WifiInterface 'NomeDaInterface'"
}

# ------------------------------------------------------------
# 4. Port proxy e Firewall
# ------------------------------------------------------------
Write-Step "Configurando port proxy e firewall para portas: $($Ports -join ', ')..."
foreach ($port in $Ports) {
  netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 | Out-Null
  netsh interface portproxy add v4tov4 `
    listenport=$port listenaddress=0.0.0.0 `
    connectport=$port connectaddress=$wslIp | Out-Null

  $ruleName = "WSL2-SnapPrice-$port"
  netsh advfirewall firewall delete rule name=$ruleName | Out-Null
  netsh advfirewall firewall add rule `
    name=$ruleName dir=in action=allow protocol=TCP localport=$port | Out-Null

  Write-Ok "Porta $port: $wslIp -> 0.0.0.0 (portproxy + firewall OK)"
}

# ------------------------------------------------------------
# 5. Grava apps/mobile/.env
# ------------------------------------------------------------
Write-Step "Atualizando apps/mobile/.env com EXPO_PUBLIC_API_URL..."
$envPath    = Join-Path $PSScriptRoot "apps\mobile\.env"
$apiUrl     = "http://${winIp}:3000"
$envContent = "# Gerado automaticamente por start-dev.ps1`nEXPO_PUBLIC_API_URL=$apiUrl`n"
Set-Content -Path $envPath -Value $envContent -Encoding UTF8
Write-Ok "EXPO_PUBLIC_API_URL=$apiUrl -> $envPath"

# ------------------------------------------------------------
# 6. Sobe Docker Compose no WSL2
# ------------------------------------------------------------
Write-Step "Subindo Docker Compose em $WslProjectPath/apps/api ..."
$out = wsl bash -c "cd '$WslProjectPath/apps/api' && docker compose up -d 2>&1"
Write-Host ($out | Out-String).Trim()
Write-Ok "Docker Compose iniciado"

# ------------------------------------------------------------
# 7. Health check
# ------------------------------------------------------------
Write-Step "Aguardando API em $apiUrl/health ..."
$maxTries = 20
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
  Write-Warn "API nao respondeu. Veja os logs com:"
  Write-Warn "  wsl bash -c 'cd $WslProjectPath/apps/api && docker compose logs -f'"
} else {
  Write-Ok "API respondendo em $apiUrl"
}

# ------------------------------------------------------------
# 8. Expo
# ------------------------------------------------------------
Write-Step "Iniciando Expo..."
Write-Host "`n  >>> IP para usar no celular: $apiUrl <<<" -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "apps\mobile")
npx expo start --dev-client
