param(
  [string]$CouchUrl = "http://localhost:5984",
  [string]$AdminUser = "admin",
  [string]$AdminPassword = "1234",
  [string]$UsersDb = "clientes",
  [string]$MixesDb = "mixes",
  [string]$LoginIdentifier = "admin",
  [string]$LoginPassword = "1234"
)

$ErrorActionPreference = "Stop"

function New-BasicAuthHeader {
  param(
    [Parameter(Mandatory = $true)][string]$User,
    [Parameter(Mandatory = $true)][string]$Password
  )

  $pair = "$User`:$Password"
  $bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
  $basic = [Convert]::ToBase64String($bytes)
  return @{ Authorization = "Basic $basic" }
}

function Ensure-Database {
  param(
    [Parameter(Mandatory = $true)][string]$DbName,
    [Parameter(Mandatory = $true)][hashtable]$Headers
  )

  try {
    Invoke-RestMethod -Method Put -Uri "$CouchUrl/$DbName" -Headers $Headers | Out-Null
    Write-Output "Base creada: $DbName"
  }
  catch {
    $message = $_.ErrorDetails.Message
    if ($message -and $message -match '"error"\s*:\s*"file_exists"') {
      Write-Output "Base ya existe: $DbName"
      return
    }

    throw
  }
}

function ConvertTo-MutableValue {
  param(
    [Parameter(Mandatory = $false)]$Value
  )

  if ($null -eq $Value) {
    return $null
  }

  if ($Value -is [string] -or $Value.GetType().IsPrimitive) {
    return $Value
  }

  if ($Value -is [System.Collections.IDictionary]) {
    $hash = @{}
    foreach ($key in $Value.Keys) {
      $hash[$key] = ConvertTo-MutableValue -Value $Value[$key]
    }
    return $hash
  }

  if ($Value -is [System.Collections.IEnumerable]) {
    $list = @()
    foreach ($item in $Value) {
      $list += ,(ConvertTo-MutableValue -Value $item)
    }
    return $list
  }

  $objHash = @{}
  foreach ($prop in $Value.PSObject.Properties) {
    $objHash[$prop.Name] = ConvertTo-MutableValue -Value $prop.Value
  }
  return $objHash
}

function Upsert-AdminUser {
  param(
    [Parameter(Mandatory = $true)][string]$DbName,
    [Parameter(Mandatory = $true)][hashtable]$Headers,
    [Parameter(Mandatory = $true)][string]$Identifier,
    [Parameter(Mandatory = $true)][string]$Password
  )

  $findBody = @{
    selector = @{
      '$or' = @(
        @{ login = $Identifier },
        @{ email = $Identifier },
        @{ username = $Identifier },
        @{ usuario = $Identifier }
      )
    }
    limit = 1
  } | ConvertTo-Json -Depth 8

  $findResponse = Invoke-RestMethod -Method Post -Uri "$CouchUrl/$DbName/_find" -Headers $Headers -ContentType "application/json" -Body $findBody
  $doc = $findResponse.docs | Select-Object -First 1

  if ($null -ne $doc) {
    $mutableDoc = ConvertTo-MutableValue -Value $doc

    $mutableDoc.login = $Identifier
    $mutableDoc.email = $Identifier
    $mutableDoc.password = $Password
    if (-not $mutableDoc.role) {
      $mutableDoc.role = "usuario"
    }
    if (-not $mutableDoc.type) {
      $mutableDoc.type = "user"
    }
    $mutableDoc.updatedAt = (Get-Date).ToUniversalTime().ToString("o")

    $id = [uri]::EscapeDataString([string]$mutableDoc._id)
    $body = $mutableDoc | ConvertTo-Json -Depth 30
    Invoke-RestMethod -Method Put -Uri "$CouchUrl/$DbName/$id" -Headers $Headers -ContentType "application/json" -Body $body | Out-Null
    Write-Output "Usuario admin actualizado en $DbName"
    return
  }

  $now = (Get-Date).ToUniversalTime().ToString("o")
  $newDoc = @{
    type = "user"
    login = $Identifier
    email = $Identifier
    password = $Password
    role = "usuario"
    createdAt = $now
    updatedAt = $now
  }

  $newBody = $newDoc | ConvertTo-Json -Depth 8
  Invoke-RestMethod -Method Post -Uri "$CouchUrl/$DbName" -Headers $Headers -ContentType "application/json" -Body $newBody | Out-Null
  Write-Output "Usuario admin creado en $DbName"
}

$authHeaders = New-BasicAuthHeader -User $AdminUser -Password $AdminPassword

Write-Output "Inicializando CouchDB en $CouchUrl"
Ensure-Database -DbName $UsersDb -Headers $authHeaders
Ensure-Database -DbName $MixesDb -Headers $authHeaders
Upsert-AdminUser -DbName $UsersDb -Headers $authHeaders -Identifier $LoginIdentifier -Password $LoginPassword
Write-Output "Inicializacion completa"
