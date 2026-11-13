SAN ANTONIO EMERGENCY MAP — QUICK START

1. Extract ALL files from this ZIP into one folder on your Windows computer.
2. Open a terminal in that folder.
3. Install the only external dependency:
       py -m pip install matplotlib
4. Generate one test image:
       py emergency_map.py --seed 42
5. Open:
       map_output\emergency_map.png

Each run makes an image automatically. It does NOT upload it anywhere.

If you want an image saved to Documents in PowerShell:
       py emergency_map.py --output-dir "$env:USERPROFILE\Documents"

Optional TCP listener:
       py map_server.py
It waits for a local TCP message on 127.0.0.1:5000, makes a PNG in
Documents, then attempts to send "done" to a listener on 127.0.0.1:5050.
Simply starting map_server.py does NOT generate an image until triggered.

Input files included:
  population_points_bexar.json
  san_antonio_hospitals.json
  low_water_crossings.json

The map contains geographic points, not a calculated road route.
