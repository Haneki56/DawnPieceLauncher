import os
import urllib.request
import json
import zipfile
import shutil
import subprocess

INSTANCE_DIR = "instances/main"
MODS_DIR = os.path.join(INSTANCE_DIR, "mods")
LIBS_DIR = os.path.join(INSTANCE_DIR, "libraries")
ASSETS_DIR = os.path.join(INSTANCE_DIR, "assets")

FORGE_VERSION = "36.2.39"
MC_VERSION = "1.16.5"

FORGE_INSTALLER_URL = f"https://maven.minecraftforge.net/net/minecraftforge/forge/{MC_VERSION}-{FORGE_VERSION}/forge-{MC_VERSION}-{FORGE_VERSION}-installer.jar"
FORGE_UNIVERSAL_URL = f"https://maven.minecraftforge.net/net/minecraftforge/forge/{MC_VERSION}-{FORGE_VERSION}/forge-{MC_VERSION}-{FORGE_VERSION}.jar"

print("Fetching Minecraft 1.16.5 server jar hash...")
version_manifest_url = "https://launchermeta.mojang.com/mc/game/version_manifest.json"
with urllib.request.urlopen(version_manifest_url) as resp:
	manifest = json.loads(resp.read().decode())
mc_version_info = next(v for v in manifest["versions"] if v["id"] == MC_VERSION)
with urllib.request.urlopen(mc_version_info["url"]) as resp:
	version_data = json.loads(resp.read().decode())
mc_server_hash = version_data["downloads"]["server"]["sha1"]
mc_server_url = version_data["downloads"]["server"]["url"]

FORGE_INSTALLER_JAR = os.path.join(INSTANCE_DIR, f"forge-{MC_VERSION}-{FORGE_VERSION}-installer.jar")
FORGE_UNIVERSAL_JAR = os.path.join(INSTANCE_DIR, f"forge-{MC_VERSION}-{FORGE_VERSION}.jar")
MC_JAR = os.path.join(INSTANCE_DIR, f"minecraft-{MC_VERSION}.jar")

os.makedirs(INSTANCE_DIR, exist_ok=True)
os.makedirs(MODS_DIR, exist_ok=True)
os.makedirs(LIBS_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)


# Download Forge installer if missing
if not os.path.exists(FORGE_INSTALLER_JAR):
	print("Downloading Forge installer...")
	try:
		urllib.request.urlretrieve(FORGE_INSTALLER_URL, FORGE_INSTALLER_JAR)
	except Exception as e:
		print(f"Failed to download Forge installer: {e}")
		print(f"Please manually download Forge installer from: {FORGE_INSTALLER_URL}")
		exit(1)
else:
	print("Forge installer already exists, skipping download.")

# Download Forge universal jar if missing
if not os.path.exists(FORGE_UNIVERSAL_JAR):
	print("Downloading Forge universal jar...")
	try:
		urllib.request.urlretrieve(FORGE_UNIVERSAL_URL, FORGE_UNIVERSAL_JAR)
	except Exception as e:
		print(f"Failed to download Forge universal jar: {e}")
		print(f"Please manually download Forge universal jar from: {FORGE_UNIVERSAL_URL}")
		exit(1)
else:
	print("Forge universal jar already exists, skipping download.")

# Download Minecraft server jar if missing
if not os.path.exists(MC_JAR):
	print(f"Downloading Minecraft server jar (sha1: {mc_server_hash})...")
	try:
		urllib.request.urlretrieve(mc_server_url, MC_JAR)
	except Exception as e:
		print(f"Failed to download Minecraft server jar: {e}")
		print(f"Please manually download Minecraft server jar from: {mc_server_url}")
		exit(1)
else:
	print("Minecraft server jar already exists, skipping download.")

print("Forge and Minecraft jars downloaded.")
print("Running Forge installer to generate libraries and configs...")
result = subprocess.run([
	"java", "-jar", FORGE_INSTALLER_JAR, "--installServer"
], cwd=INSTANCE_DIR)
if result.returncode == 0:
	print("Forge server setup complete. Instance folder is ready for launcher use.")
else:
	print("Forge installer failed. Please check java installation and logs.")
