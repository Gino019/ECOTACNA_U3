$localJdk = "C:\Users\MILTONHFLORESCHINO\Desktop\ECOTACNA\ECOTACNA\jdk17_extract\jdk-17.0.10+7"
if (Test-Path $localJdk) {
    $env:JAVA_HOME = $localJdk
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
}
Get-Content .env | Where-Object { $_ -match '^([^#=]+)=(.*)$' } | ForEach-Object { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') }
.\mvnw.cmd spring-boot:run
