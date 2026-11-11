# Repare la tache Windows « Backup Firestore Ligue Plumes ».
# A lancer dans un PowerShell ouvert en administrateur : la tache a ete creee avec ces droits,
# Set-ScheduledTask refuse sinon (« Acces refuse »).
#
# Trois changements, ceux qui ont repare la sauvegarde du projet emploi le 2026-11-10 :
#  1. node est lance par « conhost.exe --headless » : lance directement, Windows le tuait
#     quelques secondes apres le demarrage (code 0xC000013A, le 9/10 et le 9/11).
#  2. elle tourne aussi sur batterie (elle refusait de partir ou s'arretait sinon).
#  3. si l'ordinateur etait eteint ou en veille le 9 a 00:09, elle part des qu'il se rallume.

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "Ce PowerShell n'est pas en administrateur. Clic droit sur PowerShell > Executer en tant qu'administrateur, puis relancer." -ForegroundColor Red
  exit 1
}

$nom = 'Backup Firestore Ligue Plumes'
$tache = Get-ScheduledTask -TaskName $nom
$action = New-ScheduledTaskAction -Execute 'conhost.exe' `
  -Argument '--headless "C:\Program Files\nodejs\node.exe" outils/build/backup-firestore.mjs' `
  -WorkingDirectory 'C:\Users\mathi\Documents\0-Claude\1-App\ornitheque'
$reglages = $tache.Settings
$reglages.DisallowStartIfOnBatteries = $false
$reglages.StopIfGoingOnBatteries = $false
$reglages.StartWhenAvailable = $true
Set-ScheduledTask -TaskName $nom -Action $action -Settings $reglages | Out-Null

$t = Get-ScheduledTask -TaskName $nom
Write-Host "Commande   : $($t.Actions[0].Execute) $($t.Actions[0].Arguments)"
Write-Host "Dossier    : $($t.Actions[0].WorkingDirectory)"
Write-Host "Batterie   : refus=$($t.Settings.DisallowStartIfOnBatteries) arret=$($t.Settings.StopIfGoingOnBatteries)"
Write-Host "Rattrapage : $($t.Settings.StartWhenAvailable)"
Write-Host "Tache reparee." -ForegroundColor Green
