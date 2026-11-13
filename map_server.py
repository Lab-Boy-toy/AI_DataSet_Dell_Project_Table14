"""Local TCP trigger for the emergency map generator.

Start: python map_server.py
Send any nonempty UTF-8 message to localhost:5000 to generate a new map.
After saving, this process connects to localhost:5050 and sends b"done\n".
The receiving program must listen on port 5050.

Requires emergency_map.py and the three JSON datasets in the same folder.
"""

import argparse
import socket
from pathlib import Path

from emergency_map import generate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--output-dir", type=Path, default=Path.home() / "Documents")
    parser.add_argument("--listen-port", type=int, default=5000)
    parser.add_argument("--done-port", type=int, default=5050)
    parser.add_argument("--margin-miles", type=float, default=1.5)
    args = parser.parse_args()

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(("127.0.0.1", args.listen_port))
        server.listen(5)
        print(f"Waiting for a message on 127.0.0.1:{args.listen_port}", flush=True)

        while True:
            conn, address = server.accept()
            with conn:
                conn.settimeout(5)
                try:
                    payload = conn.recv(4096)
                except socket.timeout:
                    continue
                if not payload or not payload.decode("utf-8", errors="replace").strip():
                    continue

            print(f"Trigger received ({len(payload)} bytes). Generating map...", flush=True)
            try:
                generate(args.data_dir, args.output_dir, seed=None,
                         margin_miles=args.margin_miles)
            except Exception as error:
                print(f"Map generation failed: {error}", flush=True)
                continue  # Never send 'done' for failed generation.

            try:
                with socket.create_connection(("127.0.0.1", args.done_port), timeout=3) as response:
                    response.sendall(b"done\n")
                print(f"Sent 'done' to 127.0.0.1:{args.done_port}", flush=True)
            except OSError as error:
                print(f"Map saved, but completion notification failed: {error}", flush=True)


if __name__ == "__main__":
    main()
