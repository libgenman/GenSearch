import sys
from cx_Freeze import setup, Executable

build_exe_options = {
    'packages': ["flask_restful"], 
    'includes': ["jinja2.ext"], # http://stackoverflow.com/questions/14041450/using-cx-freeze-on-flask-app
    'excludes': ["Tkinter"],
}

base = None
#if sys.platform == "win32":
#    base = "Win32GUI"

setup(
    name = "flask",
    version = "0.4",
    description = "Flask App",
    options = {"build_exe": build_exe_options},
    executables = [
        Executable("flaskapi.py", base=base),
        Executable("pipelibgen2.py"),
        Executable("jsondeltalibgen.py")
    ],
)
        
