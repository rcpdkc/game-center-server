import sqlite3
import os
import uuid
import json
import time
import threading
import requests
from _paths import get_app_dir

# Sitenizin adresi
VERCEL_API_URL = "https://gamecenter.rcpdkc.com/api/telemetry"

def get_system_hwid():
    import subprocess
    import uuid
    try:
        hwid = subprocess.check_output(['powershell', '-Command', '(Get-CimInstance -Class Win32_ComputerSystemProduct).UUID'], timeout=5).decode().strip()
        if not hwid or len(hwid) < 10:
            raise ValueError("Invalid HWID")
        return hwid
    except Exception as e:
        return "HWID_ERROR_" + str(uuid.uuid4().hex[:8])

def get_db_connection():
    db_path = os.path.join(get_app_dir(), "gameserver.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def get_or_create_cafe_id(conn):
    cur = conn.cursor()
    cur.execute("SELECT value FROM settings WHERE key='cloud_cafe_id'")
    row = cur.fetchone()
    if row and row['value']:
        return row['value']
    
    # Yeni ID olustur ve kaydet
    new_id = str(uuid.uuid4())
    cur.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('cloud_cafe_id', ?)", (new_id,))
    conn.commit()
    return new_id

def get_cafe_name(conn):
    cur = conn.cursor()
    cur.execute("SELECT value FROM settings WHERE key='server_name'")
    row = cur.fetchone()
    return row['value'] if row else "Bilinmeyen Kafe"

def get_cloud_email(conn):
    """Web admin cloud girisi yapildiysa kayitli email'i dondur."""
    cur = conn.cursor()
    cur.execute("SELECT value FROM settings WHERE key='cloud_email'")
    row = cur.fetchone()
    return row['value'] if row else None

def collect_telemetry():
    conn = get_db_connection()
    try:
        cafe_id = get_or_create_cafe_id(conn)
        cafe_name = get_cafe_name(conn)
        hwid = get_system_hwid()
        
        cur = conn.cursor()
        
        # Aktif istemci sayisi
        # Son 60 dakikada last_seen guncellenen clientler (localtime ile saklaniyor)
        cur.execute("""
            SELECT COUNT(*) as c FROM clients 
            WHERE last_seen >= strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime', '-60 minutes')
        """)
        active_clients = cur.fetchone()['c']
        
        # Eger hicbir sonuc gelmezse (zaman kaymasi durumu), tum clientleri say
        if active_clients == 0:
            cur.execute("SELECT COUNT(*) as c FROM clients")
            total_clients = cur.fetchone()['c']
            # Son 2 saatte gorulen var mi diye genis pencereyle kontrol et
            cur.execute("""
                SELECT COUNT(*) as c FROM clients 
                WHERE last_seen >= strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime', '-120 minutes')
            """)
            wide_clients = cur.fetchone()['c']
            active_clients = wide_clients if wide_clients > 0 else total_clients
        
        # Donanim Istatistikleri (Ekran Kartlari)
        cur.execute("SELECT gpu_model, COUNT(*) as count FROM clients WHERE gpu_model IS NOT NULL AND gpu_model != '' GROUP BY gpu_model")
        gpu_stats = [{"name": r["gpu_model"], "count": r["count"]} for r in cur.fetchall()]
        
        # Islemci Istatistikleri
        cur.execute("SELECT cpu, COUNT(*) as count FROM clients WHERE cpu IS NOT NULL AND cpu != '' GROUP BY cpu")
        cpu_stats = [{"name": r["cpu"], "count": r["count"]} for r in cur.fetchall()]

        
        # Sicaklik verileri (OSD/clients tablosundan ortalama)
        try:
            cur.execute("""
                SELECT AVG(CAST(cpu_temp AS REAL)) as avg_cpu,
                       AVG(CAST(gpu_temp AS REAL)) as avg_gpu
                FROM clients
                WHERE cpu_temp IS NOT NULL AND cpu_temp != ''
                  AND CAST(cpu_temp AS REAL) > 0
                  AND last_seen >= strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime', '-60 minutes')
            """)
            temp_row = cur.fetchone()
            cpu_temp_avg = round(temp_row['avg_cpu']) if temp_row and temp_row['avg_cpu'] else None
            gpu_temp_avg = round(temp_row['avg_gpu']) if temp_row and temp_row['avg_gpu'] else None
        except Exception:
            cpu_temp_avg = None
            gpu_temp_avg = None

        hardware_stats = {
            "gpus": gpu_stats,
            "cpus": cpu_stats,
            "temps": {
                "cpu_avg": cpu_temp_avg,
                "gpu_avg": gpu_temp_avg,
            }
        }
        
        # En Cok Oynanan Oyunlar
        cur.execute("""
            SELECT g.name, gc.click_count 
            FROM game_clicks gc 
            JOIN games g ON gc.game_id = g.id 
            ORDER BY gc.click_count DESC 
            LIMIT 10
        """)
        top_games = [{"name": r["name"], "clicks": r["click_count"]} for r in cur.fetchall()]
        
        cloud_email = get_cloud_email(conn)

        payload = {
            "cafe_id": cafe_id,
            "cafe_name": cafe_name,
            "hwid": hwid,
            "active_clients": active_clients,
            "hardware_stats": hardware_stats,
            "top_games": top_games
        }
        if cloud_email:
            payload["cloud_email"] = cloud_email
        return payload
    finally:
        conn.close()

def send_telemetry():
    while True:
        try:
            payload = collect_telemetry()
            print(f"[Telemetry] Buluta veri gonderiliyor... ({payload['cafe_name']} - {payload['active_clients']} PC)")
            
            response = requests.post(VERCEL_API_URL, json=payload, timeout=10)
            if response.status_code == 200:
                print("[Telemetry] Veri basariyla gonderildi.")
            else:
                print(f"[Telemetry] Gonderim hatasi: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"[Telemetry] Hata olustu: {e}")
            
        # Her 15 dakikada bir veri gonder (900 saniye)
        time.sleep(900)

def start_telemetry_thread():
    t = threading.Thread(target=send_telemetry, daemon=True)
    t.start()
    return t

if __name__ == "__main__":
    print("Telemetry test ediliyor... (Cikmak icin CTRL+C)")
    send_telemetry()
