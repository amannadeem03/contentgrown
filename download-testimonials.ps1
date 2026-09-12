$ErrorActionPreference = "Stop"

$imgDir = "C:\CLAUDE\contentgrown-clone\assets\testimonials\images"
$vidDir = "C:\CLAUDE\contentgrown-clone\assets\testimonials\videos"
New-Item -ItemType Directory -Force -Path $imgDir | Out-Null
New-Item -ItemType Directory -Force -Path $vidDir | Out-Null

$images = @(
  @{ id="1NyyX3z8C9koPH58a2VY6FKm7JvjVhy67"; name="text-01.jpeg" },
  @{ id="1DDnnQZBvtKDJv2ra1guFPYrLZOTycgZb"; name="text-02.jpeg" },
  @{ id="1fdOMvYJBkKq30kXB46S1ytU_VbesCuGN"; name="text-03.jpeg" },
  @{ id="13UbYXbF_NH5WVqJkh4mByPfWSqer7qKl"; name="text-04.jpeg" },
  @{ id="169ruWBfmNosgZmlniQ2bw2cRs51FqSlS"; name="text-05.jpeg" },
  @{ id="1wg_67goyDP6ShAuELFynCpigVbYXlSV1"; name="text-06.jpeg" },
  @{ id="1WLSChIgI1PoFF7MRXwbQb0dVTcNbt-EB"; name="text-07.jpeg" },
  @{ id="1CFz1pHPtUnvZMKQX56bw3GKzo8onZY15"; name="text-08.jpeg" },
  @{ id="1NTrp6BUUZNS6Kkz4CYdGgUNvv6K2aamY"; name="text-09.jpeg" },
  @{ id="1QlRiw2jjbpYJVHuNVcHG4t-9Msbyt1zc"; name="text-10.jpeg" },
  @{ id="1APLF0rUmtHF_ByHTB6_vPCp4FYF5YCfh"; name="text-11.jpeg" },
  @{ id="124r2IIZykRaEQOewx3nTrhdqRBg4Tk8O"; name="text-12.jpeg" },
  @{ id="1T_22s3AV3WMdZvV6aIbxjvwqQRYRerh1"; name="text-13.jpeg" },
  @{ id="1F2t3BYQ6ETntFWpQA1wcl7_fTlxrw5-m"; name="text-14.jpeg" },
  @{ id="17z_6lPFkppPRo7JL5-GhCql7SEd8S4aW"; name="text-15.jpeg" }
)

$videos = @(
  @{ id="1x16I0IENFbQ152KkRcAipLFf_BH7OQ33"; name="aaron-testimonial.mp4" },
  @{ id="1TI9oDi_Yixla9ELh6rvm1Q921gpzStRr"; name="jaime-testimonial.mp4" },
  @{ id="1pvvK8UUmI2f6bBwyB7YNGtOiVXla_Q8T"; name="ramses-testimonial.mp4" }
)

function Download-GDrive($id, $outPath) {
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $url = "https://drive.google.com/uc?export=download&id=$id"
  try {
    Invoke-WebRequest -Uri $url -OutFile $outPath -WebSession $session -UseBasicParsing
  } catch {
    Write-Output "First attempt failed for $id : $_"
    return $false
  }
  $bytes = [System.IO.File]::ReadAllBytes($outPath)
  $head = [System.Text.Encoding]::ASCII.GetString($bytes[0..([Math]::Min(200, $bytes.Length-1))])
  if ($head -like "*<html*" -or $head -like "*Google Drive*confirm*") {
    if ($head -match "confirm=([0-9A-Za-z_]+)") {
      $confirm = $matches[1]
      $url2 = "https://drive.google.com/uc?export=download&confirm=$confirm&id=$id"
      Invoke-WebRequest -Uri $url2 -OutFile $outPath -WebSession $session -UseBasicParsing
    } else {
      Write-Output "WARNING: $outPath may be an HTML confirmation page, not the file."
      return $false
    }
  }
  return $true
}

foreach ($img in $images) {
  $out = Join-Path $imgDir $img.name
  $ok = Download-GDrive $img.id $out
  $size = (Get-Item $out -ErrorAction SilentlyContinue).Length
  Write-Output "$($img.name): ok=$ok size=$size"
}

foreach ($vid in $videos) {
  $out = Join-Path $vidDir $vid.name
  $ok = Download-GDrive $vid.id $out
  $size = (Get-Item $out -ErrorAction SilentlyContinue).Length
  Write-Output "$($vid.name): ok=$ok size=$size"
}
