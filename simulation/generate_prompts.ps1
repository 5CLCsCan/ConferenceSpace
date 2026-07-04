$ErrorActionPreference = "Stop"

$personasJson = (Get-Content -Raw "personas.json" -Encoding UTF8 | ConvertFrom-Json).agents
$systemRules = Get-Content -Raw "templates\_system_rules.md" -Encoding UTF8

$outputDir = "generated_prompts"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

function Get-FlattenedProperties {
    param([PSCustomObject]$Obj, [string]$Prefix)
    $dict = @{}
    
    foreach ($prop in $Obj.psobject.properties) {
        $key = if ($Prefix) { "$Prefix." + $prop.Name } else { $prop.Name }
        $val = $prop.Value
        
        if ($null -eq $val) {
            $dict[$key] = "null"
        }
        elseif ($val -is [System.Management.Automation.PSCustomObject]) {
            # Cũng lưu chuỗi JSON cho object phòng khi template dùng nguyên khối object
            $dict[$key] = ($val | ConvertTo-Json -Depth 10 -Compress)
            
            $subDict = Get-FlattenedProperties -Obj $val -Prefix $key
            foreach ($k in $subDict.Keys) { $dict[$k] = $subDict[$k] }
        }
        elseif ($val -is [array]) {
            # Map array itself as JSON
            $dict[$key] = ($val | ConvertTo-Json -Depth 10 -Compress)
            # Map elements
            for ($i = 0; $i -lt $val.Length; $i++) {
                $subKey = "$key" + "[$i]"
                if ($val[$i] -is [System.Management.Automation.PSCustomObject]) {
                    $subDict = Get-FlattenedProperties -Obj $val[$i] -Prefix $subKey
                    foreach ($k in $subDict.Keys) { $dict[$k] = $subDict[$k] }
                } else {
                    $dict[$subKey] = $val[$i] -as [string]
                }
            }
        }
        else {
            $dict[$key] = $val -as [string]
        }
    }
    return $dict
}

foreach ($agent in $personasJson) {
    $role = $agent.role
    $templatePath = "templates\${role}_template.md"
    
    if (-not (Test-Path $templatePath)) {
        Write-Host "Warning: $templatePath not found"
        continue
    }
    
    $roleTemplate = Get-Content -Raw $templatePath -Encoding UTF8
    $fullPrompt = $systemRules + "`r`n`r`n" + $roleTemplate
    
    # Flatten agent object
    $dict = Get-FlattenedProperties -Obj $agent -Prefix "agent"
    
    # Do replacements for all found {{agent.*}} placeholders
    $regex = '\{\{(agent\.[^}]+)\}\}'
    $matches = [regex]::Matches($fullPrompt, $regex)
    
    foreach ($match in $matches) {
        $placeholder = $match.Groups[0].Value
        $key = $match.Groups[1].Value
        
        if ($dict.Contains($key)) {
            $fullPrompt = $fullPrompt.Replace($placeholder, $dict[$key])
        } else {
            Write-Host "[Warning] Không tìm thấy giá trị cho biến: $key ở agent $($agent.id)"
        }
    }
    
    $safeName = $agent.identity.display_name -replace '[^a-zA-Z0-9]', '_' -replace '_+', '_'
    $safeName = $safeName.ToLower().Trim('_')
    $fileName = "$($agent.id)_$safeName.md"
    $outPath = Join-Path $outputDir $fileName
    
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $outPath), $fullPrompt, [System.Text.Encoding]::UTF8)
    Write-Host "✅ Created: $fileName"
}
Write-Host "`n🎉 Đã tạo thành công $( $personasJson.Count ) prompt files tại: $outputDir"
