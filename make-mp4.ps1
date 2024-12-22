Write-Output $args[0]
$folder = $args[0]

Get-ChildItem ".\videos\$folder\" -Filter *.mkv |
ForEach-Object {
    $fileName = $_.BaseName
    ffmpeg -i $_.FullName -codec copy ".\videos\$folder\$fileName.mp4"
    Remove-Item $_.FullName
}