"""Create a cropped, dots-only emergency/hospital/low-water-crossing map.

Run with: python emergency_map.py --seed 42
Requires: matplotlib (pip install matplotlib)
Put the three JSON input files next to this script, or use --data-dir.
"""

import argparse
import csv
import json
import math
import random
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Each visible crossing gets its own shape/color pair, matched in the key.
MARKERS = ["s", "o", "^", "D", "v", "P", "X", "*", "<", ">", "h", "p", "8", "d", "H"]
PALETTE = ["#f472b6", "#0ea5e9", "#f59e0b", "#14b8a6", "#a78bfa",
           "#84cc16", "#f97316", "#64748b", "#06b6d4", "#c084fc",
           "#eab308", "#10b981", "#fb7185", "#3b82f6", "#a3e635",
           "#d946ef", "#38bdf8", "#fb923c", "#2dd4bf", "#818cf8"]


def load(name, folder):
    with (folder / name).open(encoding="utf-8") as f:
        return json.load(f)


def distance_miles(a, b):
    """Haversine great-circle distance between two latitude/longitude dictionaries."""
    lat1, lon1 = math.radians(a["latitude"]), math.radians(a["longitude"])
    lat2, lon2 = math.radians(b["latitude"]), math.radians(b["longitude"])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    value = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 3958.76 * 2 * math.asin(min(1, math.sqrt(value)))


def generate(data_dir, output_dir, seed, margin_miles):
    population = load("population_points_bexar.json", data_dir)
    hospitals = load("san_antonio_hospitals.json", data_dir)
    crossings = load("low_water_crossings.json", data_dir)
    rng = random.Random(seed)

    # Census tracts are selected proportional to their resident populations.
    emergency_id = rng.choices(list(population), weights=[item["population"] for item in population.values()], k=1)[0]
    emergency = population[emergency_id]

    # Screening filter only: source inventory is not a verified live ED directory.
    eligible = [(key, item) for key, item in hospitals.items()
                if item["type"] == "GENERAL ACUTE CARE" and item["status"] == "OPEN"]
    if len(eligible) < 2:
        raise ValueError("Fewer than two open general-acute-care hospitals in input")
    nearest = sorted(eligible, key=lambda pair: distance_miles(emergency, pair[1]))[:2]

    main = [emergency] + [hospital for _, hospital in nearest]
    center_lat = sum(p["latitude"] for p in main) / len(main)
    # Convert margin miles into degrees at San Antonio's latitude.
    lat_margin = margin_miles / 69.0
    lon_margin = margin_miles / (69.172 * math.cos(math.radians(center_lat)))
    south = min(p["latitude"] for p in main) - lat_margin
    north = max(p["latitude"] for p in main) + lat_margin
    west = min(p["longitude"] for p in main) - lon_margin
    east = max(p["longitude"] for p in main) + lon_margin

    visible = [(key, item) for key, item in crossings.items()
               if south <= item["latitude"] <= north and west <= item["longitude"] <= east]
    visible.sort(key=lambda pair: pair[1]["object_id"])

    key_columns = max(1, math.ceil(len(visible) / 24))
    key_rows = max(1, math.ceil(len(visible) / key_columns))
    fig = plt.figure(figsize=(11 + key_columns * 4.0, max(9, 2.0 + key_rows * 0.42)), dpi=150)
    layout = fig.add_gridspec(1, 2, width_ratios=[3.2, key_columns * 1.4], wspace=0.18)
    ax = fig.add_subplot(layout[0, 0])
    key_ax = fig.add_subplot(layout[0, 1])
    fig.patch.set_facecolor("white")
    ax.set_facecolor("#f8fafc")

    # Only independent dots: no connecting lines or inferred roads.
    ax.scatter([emergency["longitude"]], [emergency["latitude"]], s=210,
               c="#dc2626", edgecolors="white", linewidths=2.2, zorder=5, label="Emergency location")
    for index, (_, hospital) in enumerate(nearest, start=1):
        ax.scatter([hospital["longitude"]], [hospital["latitude"]], s=195,
                   c="#16a34a", edgecolors="white", linewidths=2.2, zorder=5,
                   label="Nearest hospitals" if index == 1 else None)
        ax.annotate(f"H{index}", (hospital["longitude"], hospital["latitude"]),
                    xytext=(7, 7), textcoords="offset points", fontsize=9,
                    fontweight="bold", color="#166534")

    key_ax.set_xlim(0, key_columns)
    key_ax.set_ylim(0, key_rows + 2)
    key_ax.axis("off")
    key_ax.text(0.02, key_rows + 1.35, "Low-water crossing key", fontsize=15,
                weight="bold", ha="left")
    key_ax.text(0.02, key_rows + 0.66, "Shape + color → slot → crossing ID", fontsize=10,
                color="#475569", ha="left")

    for index, (_, crossing) in enumerate(visible):
        shape = MARKERS[index % len(MARKERS)]
        color_index = (index // len(MARKERS) + 7 * (index % len(MARKERS))) % len(PALETTE)
        color = PALETTE[color_index]
        ax.scatter([crossing["longitude"]], [crossing["latitude"]], s=180,
                   c=[color], marker=shape, edgecolors="#172033", linewidths=0.9, zorder=4)
        column, row = divmod(index, key_rows)
        y = key_rows - row - 0.1
        key_ax.scatter([column + 0.12], [y], s=180, c=[color], marker=shape,
                       edgecolors="#172033", linewidths=0.9, clip_on=False)
        key_ax.text(column + 0.24, y,
                    f"Slot {index + 1} · Crossing #{crossing['object_id']}",
                    va="center", fontsize=9, color="#172033")

    ax.set_xlim(west, east)
    ax.set_ylim(south, north)
    # Correct latitude/longitude aspect for reasonably shaped geographic distances.
    ax.set_aspect(1 / math.cos(math.radians(center_lat)), adjustable="box")
    ax.grid(True, alpha=0.17)
    ax.set_xlabel("Longitude (°)")
    ax.set_ylabel("Latitude (°)")
    ax.set_title("Emergency access points — San Antonio area", weight="bold", fontsize=15, pad=15)
    ax.legend(loc="upper right", framealpha=0.95)
    fig.subplots_adjust(left=0.07, right=0.98, top=0.91, bottom=0.08)

    output_dir.mkdir(parents=True, exist_ok=True)
    png_path = output_dir / "emergency_map.png"
    fig.savefig(png_path, bbox_inches="tight")
    plt.close(fig)

    # Slot numbers are specific to each render; source IDs remain stable.
    lookup_path = output_dir / "visible_crossings.csv"
    with lookup_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["render_slot", "source_object_id", "crossing_id", "name", "latitude", "longitude"])
        for index, (key, item) in enumerate(visible, start=1):
            writer.writerow([index, item["object_id"], key, item["name"], item["latitude"], item["longitude"]])

    details_path = output_dir / "selection.json"
    details = {"seed": seed, "census_tract": emergency_id,
               "emergency": emergency,
               "hospitals": [{"id": key, **item} for key, item in nearest],
               "visible_crossings": len(visible),
               "margin_miles": margin_miles,
               "note": "Dots are geographic reference points; no road routing or flood exposure assessment was performed."}
    details_path.write_text(json.dumps(details, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {png_path} with {len(visible)} crossings; hospitals: "
          + ", ".join(item["name"] for _, item in nearest))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parent / "map_output")
    parser.add_argument("--seed", type=int, default=None, help="Optional seed to repeat the same random scenario")
    parser.add_argument("--margin-miles", type=float, default=1.5)
    args = parser.parse_args()
    if args.margin_miles <= 0:
        parser.error("--margin-miles must be positive")
    generate(args.data_dir, args.output_dir, args.seed, args.margin_miles)
