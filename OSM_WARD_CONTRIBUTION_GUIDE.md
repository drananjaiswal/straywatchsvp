# OSM Ward Boundary Contribution Guide
## Port Blair Municipal Council — 24 Wards
### For StrayWatch SVP

---

## Purpose

This guide describes the complete procedure for digitising the 24 official ward boundaries
of the Port Blair Municipal Council (PBMC) into OpenStreetMap (OSM), and extracting the
result as `public/ward-boundaries.geojson` for use in StrayWatch SVP.

Once contributed, the boundaries become freely available to all civic applications under
the Open Database Licence (ODbL) — permanently resolving the data gap for Port Blair.

The current `ward-boundaries.geojson` in this repository is **approximated** from locality
centroids. Completing this contribution replaces it with legally verified, geographically
accurate polygons.

---

## Legal Prerequisite — Source Map Clearance

Before digitising, you must confirm that the source map is permissible for OSM use.

### Option A — Survey of India clearance (already granted)

The OSM India community has received written clarification from the Survey of India
that administrative boundaries up to the village layer may be freely used for both
commercial and non-commercial purposes. The PBMC ward map, if derived from Survey of
India base data, falls within this clearance.
Reference: https://wiki.openstreetmap.org/wiki/SOI_Usage_clarification

### Option B — PBMC-issued map

If you obtain the ward boundary map directly from the PBMC or the Office of the
District Collector, South Andaman, request a letter confirming that the map is
released for public use. Forward this letter to the OSM India mailing list
(talk-in@openstreetmap.org) for documentation before uploading.

### Option C — Field-verified boundaries

Boundaries traced by walking ward edges and recording GPS tracks carry no licensing
encumbrance and may be uploaded directly.

---

## Required OSM Tags — PBMC Wards

Per the OSM India Local Government Boundaries standard
(https://wiki.openstreetmap.org/wiki/India/Local_Government_Boundaries),
each ward relation must carry the following tags:

| Tag | Value | Notes |
|---|---|---|
| `type` | `boundary` | Required on all boundary relations |
| `boundary` | `administrative` | Standard administrative boundary |
| `admin_level` | `10` | Municipal ward level per India OSM standard |
| `local_authority:IN` | `ward` | Urban ward of a Municipal Council |
| `name` | Ward name in English | e.g. `Aberdeen Bazaar` |
| `name:en` | Ward name in English | Duplicate for multilingual support |
| `ward` | Ward number | e.g. `1`, `2` ... `24` |
| `ref` | Ward number | Numeric reference |
| `is_in:city` | `Sri Vijaya Puram` | Official city name as of 13 Sep 2024 |
| `is_in:state` | `Andaman and Nicobar Islands` | |
| `is_in:country` | `India` | |
| `source` | Source description | e.g. `PBMC ward map 2015` |

The parent relation for the PBMC municipal boundary itself should be tagged:

| Tag | Value |
|---|---|
| `type` | `boundary` |
| `boundary` | `local_authority` |
| `local_authority:IN` | `municipality` |
| `admin_level` | `8` |
| `name` | `Port Blair Municipal Council` |
| `name:en` | `Port Blair Municipal Council` |

---

## Step-by-Step Digitising Procedure

### Step 1 — Obtain the source ward map

Obtain the official PBMC ward boundary map from one of the following:

1. **PBMC Office**, Aberdeen Bazaar, Port Blair — request the ward delimitation map
   issued after the 2015 expansion to 41.22 sq km and 24 wards
2. **Office of the District Collector**, South Andaman — the delimitation order
   (notification) will include a boundary description or attached map
3. **State Election Commission, A&N Islands** — ward delimitation notifications are
   published before each municipal election

Scan the map at minimum 300 DPI and save as a georeferenced TIFF if possible,
or as a plain image if not.

---

### Step 2 — Install JOSM

Download JOSM (Java OpenStreetMap Editor) from https://josm.openstreetmap.de/

JOSM is strongly preferred over the web iD editor for boundary digitising because:
- It supports relation editing visually
- It handles shared boundary ways between adjacent wards correctly
- It has a Validator that catches topology errors before upload

Install the **PicLayer** plugin (JOSM → Edit → Preferences → Plugins → PicLayer)
to load the scanned ward map as a background reference layer.

---

### Step 3 — Georeference the ward map image

If the scanned map is not already georeferenced, use QGIS to pin the image to
known coordinates before importing into JOSM.

```
1. Open QGIS → Layer → Add Layer → Add Raster Layer → select your scanned map
2. Plugins → Georeferencer
3. Add control points at identifiable landmarks:
   - Aberdeen Jetty: 11.6666° N, 92.7348° E
   - Cellular Jail: 11.6713° N, 92.7440° E
   - Veer Savarkar International Airport: 11.6412° N, 92.7297° E
   - Haddo Wharf: 11.6788° N, 92.7316° E
4. Set CRS to EPSG:4326 (WGS84)
5. Export as GeoTIFF
```

---

### Step 4 — Load background imagery in JOSM

In JOSM, add the georeferenced ward map as a background layer:

```
Imagery → PicLayer → Open from file → select GeoTIFF
```

Also enable Bing or ESRI World Imagery as a secondary reference:

```
Imagery → Bing Aerial Imagery
```

Cross-check that roads and coastline in the satellite imagery align with the
scanned ward map. If there is a systematic offset, use the PicLayer offset
controls to correct it.

---

### Step 5 — Download existing OSM data for Port Blair

In JOSM, download the existing OSM data for the Port Blair area:

```
File → Download Data
Bounding box: South 11.62, West 92.68, North 11.72, East 92.77
Enable: OpenStreetMap data
Click: Download
```

This ensures your new ward boundaries share nodes correctly with existing
roads, coastline, and any existing administrative boundaries.

---

### Step 6 — Trace ward boundary ways

For each ward boundary:

1. Select the **Draw nodes** tool (shortcut: `A`)
2. Trace the ward boundary by clicking along the edge shown on your reference map
3. Close the polygon by clicking the first node again
4. Tag the resulting **way** with:
   - `boundary=administrative`
   - `admin_level=10`

**Critical rule — shared boundaries:** Where two ward boundaries share an edge
(which is almost every internal boundary), they must share the **same way**, not
two overlapping ways. To achieve this:

- Draw the boundary of Ward 1 first, closing the polygon
- When tracing Ward 2, click directly on the existing nodes of Ward 1's boundary
  where the borders coincide, rather than drawing new overlapping ways
- Use Tools → Split Way (shortcut: `P`) to split existing ways at junction points
  if needed

---

### Step 7 — Create a relation for each ward

For each ward, create a relation:

```
Relation → Create a new relation
```

In the relation editor:

1. Add the boundary way(s) for this ward as members with role `outer`
2. Add tags as specified in the Required OSM Tags table above
3. Add a node at the ward centroid (or the main locality node) with role `admin_centre`

Repeat for all 24 wards.

**Ward names and numbers for PBMC (24 wards):**

| Ward | Name |
|---|---|
| 1 | Aberdeen Bazaar |
| 2 | Junglighat |
| 3 | Naya Bazar |
| 4 | Goalghar |
| 5 | Dairy Farm |
| 6 | Phoenix Bay |
| 7 | Haddo |
| 8 | Bathubasti |
| 9 | Delanipur |
| 10 | Premnagar |
| 11 | Prem Nagar Extension |
| 12 | Shadipur |
| 13 | Lamba Line |
| 14 | Garacharma |
| 15 | Dollygunj |
| 16 | Atlanta Point |
| 17 | Gurudwara Line |
| 18 | Brookshabad |
| 19 | Teal House |
| 20 | Minnie Bay |
| 21 | South Point |
| 22 | Panighat |
| 23 | Bimblitan |
| 24 | Chouldari |

---

### Step 8 — Run the JOSM Validator

Before uploading:

```
Validation → Validate
```

Resolve all errors of type:
- `Boundary way not closed` — close the ring
- `Relation member missing role` — assign `outer` or `admin_centre` roles
- `Overlapping ways` — merge shared boundary segments
- `Duplicate nodes` — merge coincident nodes (Tools → Merge Nodes, shortcut: `M`)

Warnings (non-errors) about `crossing boundaries` may be acceptable at coastline
intersections.

---

### Step 9 — Upload to OSM

```
File → Upload data
Changeset comment: "Add PBMC municipal ward boundaries (24 wards), Port Blair,
Andaman & Nicobar Islands. Source: PBMC ward delimitation map 2015.
For StrayWatch SVP civic platform."
Source tag: PBMC ward map 2015
```

Ensure you are logged in with your OSM account. Create one at
https://www.openstreetmap.org/user/new if needed.

---

### Step 10 — Extract GeoJSON for StrayWatch SVP

After the data is live on OSM (allow 1–2 hours for tile propagation), extract
the ward boundaries using the Overpass API.

#### Option A — Overpass Turbo (browser)

1. Go to https://overpass-turbo.eu/
2. Navigate the map to Port Blair
3. Paste the following query and click Run:

```
[out:json][timeout:60];
relation
  ["boundary"="administrative"]
  ["admin_level"="10"]
  ["is_in:city"="Sri Vijaya Puram"]
  (11.60,92.68,11.73,92.77);
out body;
>;
out skel qt;
```

4. Click **Export → GeoJSON** to download the file

#### Option B — Command line with osmium

```bash
# Download the area
wget "https://overpass-api.de/api/interpreter?data=[out:xml];relation['admin_level'='10']['is_in:city'='Sri Vijaya Puram'](11.60,92.68,11.73,92.77);out body;>;out skel qt;" -O pbmc_wards.osm

# Convert to GeoJSON
pip install osmium
python3 -c "
import osmium, json
# Use osmium-tool: osmium export pbmc_wards.osm -o pbmc_wards.geojson
"
# Or use ogr2ogr (GDAL):
ogr2ogr -f GeoJSON pbmc_wards.geojson pbmc_wards.osm
```

#### Option C — QGIS QuickOSM plugin

```
Vector → QuickOSM → QuickOSM
Key: boundary  Value: administrative
In: Port Blair
Advanced: admin_level = 10
Run query → Export as GeoJSON
```

---

### Step 11 — Format GeoJSON for StrayWatch SVP

The extracted GeoJSON must have `ward_id` and `ward_name` as feature properties
for `wardDetect.js` to function correctly.

Run the following script to remap OSM properties to the required format:

```python
import json

with open("pbmc_wards_raw.geojson") as f:
    raw = json.load(f)

features = []
for feat in raw["features"]:
    props = feat.get("properties", {})
    ward_num = int(props.get("ward", props.get("ref", 0)))
    ward_name_raw = props.get("name", f"Ward {ward_num}")
    # Normalise to match wards.json format
    ward_name = f"Ward {ward_num} - {ward_name_raw}" if not ward_name_raw.startswith("Ward") else ward_name_raw
    features.append({
        "type": "Feature",
        "properties": {
            "ward_id": ward_num,
            "ward_name": ward_name,
            "source": "OpenStreetMap contributors (ODbL)"
        },
        "geometry": feat["geometry"]
    })

# Sort by ward_id
features.sort(key=lambda f: f["properties"]["ward_id"])

output = {
    "type": "FeatureCollection",
    "_comment": "PBMC ward boundaries sourced from OpenStreetMap (ODbL). Verified official data.",
    "features": features
}

with open("ward-boundaries.geojson", "w") as f:
    json.dump(output, f, indent=2)

print(f"Exported {len(features)} ward features")
```

Place the resulting `ward-boundaries.geojson` in the `public/` directory of
StrayWatch SVP, replacing the current approximated file.

---

## Verification

After replacing the file, verify ward detection is working correctly:

1. Run `npm run dev`
2. Open the app and tap "Use my location" from inside a known ward
3. Confirm the detected ward name matches the physical location
4. Test at least 5 ward centroids using the browser console:

```javascript
import { getWardForLocation } from './src/lib/wardDetect.js'
// Aberdeen Bazaar area
getWardForLocation(11.6650, 92.7310).then(console.log)
// Expected: { ward_id: 1, ward_name: 'Ward 1 - Aberdeen Bazaar' }
```

---

## OSM Community and Support

- **OSM India mailing list:** talk-in@openstreetmap.org
- **OSM India Telegram:** t.me/OSMIndia
- **OSM Kerala (most active ward mapping community):** t.me/osmkerala
  The Kerala OSM community has completed ward mapping for multiple municipal
  corporations and can advise on India-specific tagging conventions.
- **Kerala ward mapping workflow reference:**
  https://github.com/osmkerala/lsgmaps/blob/main/local%20body%20ward%20mapping.odt

---

## Attribution

Once the OSM data is live, add the following attribution to the StrayWatch SVP
`About` page and `README.md`:

> Ward boundary data © OpenStreetMap contributors, available under the
> Open Database Licence (ODbL). https://www.openstreetmap.org/copyright

---

*This guide was prepared for the StrayWatch SVP project, Port Blair Municipal Council,
Andaman & Nicobar Islands. Contributions to OSM benefit all future civic applications
using geographic data for Sri Vijaya Puram.*
