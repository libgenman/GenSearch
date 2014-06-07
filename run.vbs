Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = WScript.CreateObject("WScript.Shell") 
WshShell.CurrentDirectory = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "bin\searchd.exe --pidfile", 0, false ' run in background
WshShell.Run "flaskbin\flaskapi.exe", 0, false ' run in background
Set WshShell = Nothing
