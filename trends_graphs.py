import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

df = pd.read_csv("climate_annual.csv")
sd = df[df.location == "San Diego"]
scen = ["ssp126", "ssp245", "ssp585"]
names = {"ssp126": "SSP1-2.6", "ssp245": "SSP2-4.5", "ssp585": "SSP5-8.5"}
cols = {"ssp126": "#2a9d8f", "ssp245": "#e9a23b", "ssp585": "#c0392b"}
note = "CESM2 r4i1p1f1, nearest grid cell. Anomaly vs 1985-2014 mean (°C), not preindustrial."

# Graph 1: annual anomalies
fig, ax = plt.subplots(figsize=(9, 5))
h = sd[sd.scenario == "historical"]
ax.plot(h.year, h.anomaly_c, color="#888", lw=1.3, label="Historical")
for s in scen:
    d = sd[sd.scenario == s]
    ax.plot(d.year, d.anomaly_c, color=cols[s], lw=1.1, alpha=.85, label=names[s])
ax.axhline(0, color="k", lw=.8)
ax.set_title("San Diego: annual temperature anomaly by scenario")
ax.set_xlabel("Year"); ax.set_ylabel("Anomaly vs 1985-2014 (°C)"); ax.legend(frameon=False)
fig.text(.01, .005, note, fontsize=8, color="#555")
fig.tight_layout(rect=(0, .03, 1, 1)); fig.savefig("graph1_annual_anomalies.png", dpi=160)

# Graph 2: 20-year trailing average (blank years are skipped)
fig, ax = plt.subplots(figsize=(9, 5))
for s in scen:
    d = sd[sd.scenario == s].dropna(subset=["rolling_20yr_anomaly_c"])
    ax.plot(d.year, d.rolling_20yr_anomaly_c, color=cols[s], lw=2.5, label=names[s])
ax.axhline(0, color="k", lw=.8)
ax.set_title("San Diego: 20-year trailing average anomaly")
ax.set_xlabel("Year (end of 20-yr window)"); ax.set_ylabel("20-yr mean anomaly (°C)"); ax.legend(frameon=False)
fig.text(.01, .005, note, fontsize=8, color="#555")
fig.tight_layout(rect=(0, .03, 1, 1)); fig.savefig("graph2_rolling_20yr.png", dpi=160)
print("Done! Made graph1_annual_anomalies.png and graph2_rolling_20yr.png")
