import test from "node:test";
import assert from "node:assert/strict";
import { parseLisSkins, parseSkinport, parseFallback, quoteCurrent, isRecent } from "./build-skins-prices.mjs";

const NOW = Date.parse("2026-11-07T00:00:00.000Z");

test("ignores ridiculous high Skinport listing and uses plausible live median", () => {
  const lis = parseLisSkins([{ name: "Clutch Case", price: 0.33, count: 15 }]);
  const skinport = parseSkinport([{market_hash_name:"Clutch Case", quantity:30073,
    min_price:0.33, max_price:113333.09, median_price:0.96, suggested_price:0.46 }]);
  assert.deepEqual(quoteCurrent(lis.get("Clutch Case"), skinport.get("Clutch Case")), {min:0.33,max:0.96});
});

test("filters 0.15 to 162.07 outlier and returns current representative price", () => {
  const lis = parseLisSkins([{ name: "P2000", price:0.27, count:148 }]);
  const skinport = parseSkinport([{ market_hash_name:"P2000", quantity:148,
    min_price:0.15, max_price:162.07, median_price:0.41, suggested_price:0.17 }]);
  assert.deepEqual(quoteCurrent(lis.get("P2000"), skinport.get("P2000")), {min:0.15,max:0.41});
});

test("rejects manipulated median with only two listings", () => {
  const lis = parseLisSkins([{name:"Sticker Quick Peek",price:0.15,count:166}]);
  const skinport = parseSkinport([{market_hash_name:"Sticker Quick Peek",quantity:2,
    min_price:5.22,max_price:102212.1,median_price:51108.66,suggested_price:0.22}]);
  assert.deepEqual(quoteCurrent(lis.get("Sticker Quick Peek"),skinport.get("Sticker Quick Peek")),{min:0.15,max:0.15});
});

test("does not treat suggested_price as an active listing", () => {
  const skinport = parseSkinport([{market_hash_name:"Gone",quantity:0,
    min_price:null,max_price:null,median_price:null,suggested_price:646}]);
  assert.equal(skinport.has("Gone"),false);
  assert.equal(quoteCurrent(null,skinport.get("Gone")),null);
});

test("duplicate Doppler variants: keep the lowest active variant", () => {
  const skinport = parseSkinport([
    {market_hash_name:"Doppler",version:"Ruby",quantity:3,min_price:1650,median_price:1700},
    {market_hash_name:"Doppler",version:"Phase 3",quantity:15,min_price:390,median_price:450},
    {market_hash_name:"Doppler",version:"Phase 2",quantity:20,min_price:530,median_price:620},
    {market_hash_name:"Doppler",version:"Phase 1",quantity:0,min_price:null,suggested_price:380},
  ]);
  assert.deepEqual(quoteCurrent(null,skinport.get("Doppler")),{min:390,max:450});
});

test("fallback only accepts price-model-v2 records younger than 72 hours", () => {
  const fallback = parseFallback([
    {name:"Legacy",min_price:0.14,max_price:646,last_seen_at:"2026-11-06T10:00:00.000Z"},
    {name:"Old",min_price:1,max_price:2,price_model:2,last_seen_at:"2026-11-01T00:00:00.000Z"},
    {name:"Recent",min_price:1,max_price:2,price_model:2,last_seen_at:"2026-11-06T10:00:00.000Z"},
    {name:"StillBad",min_price:1,max_price:646,price_model:2,last_seen_at:"2026-11-06T10:00:00.000Z"},
  ], NOW);
  assert.equal(fallback.size,1);
  assert.equal(fallback.get("Recent").max,2);
  assert.equal(isRecent("2026-11-04T00:00:00.000Z",NOW),true);
  assert.equal(isRecent("2026-11-03T23:59:59.000Z",NOW),false);
});

test("LIS listings require a positive count and valid price",()=>{
  const lis = parseLisSkins([
    {name:"No listings",price:23,count:0},
    {name:"Live",price:0.14,count:10},
    {name:"Live",price:0.17,count:5},
  ]);
  assert.equal(lis.size,1);
  assert.equal(lis.get("Live").min,0.14);
});

// End-to-end check: a disappearing listing may use only a *verified* recent
// price, then must disappear completely when the snapshot is too old.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("end-to-end recent fallback survives 1 day, expires after 72 hours", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "skin-prices-test-"));
  const script = fileURLToPath(new URL("./build-skins-prices.mjs", import.meta.url));
  const lisPath = path.join(dir, "lis-skins.raw.json");
  const spPath = path.join(dir, "skinport.raw.json");
  const outPath = path.join(dir, "skins-prices.json");
  const write = (file, v) => fs.writeFileSync(file, JSON.stringify(v));
  const run = (iso) => {
    const child = spawnSync(process.execPath, [script], {
      env: { ...process.env, SKINS_PRICES_DATA_DIR: dir, SKINS_PRICES_NOW_ISO: iso },
      encoding: "utf8",
    });
    assert.equal(child.status, 0, child.stderr);
    return JSON.parse(fs.readFileSync(outPath, "utf8"));
  };
  try {
    write(lisPath, [{name:"Active",price:10,count:2},{name:"Stable",price:1,count:10}]);
    write(spPath, [{market_hash_name:"Active",min_price:11,median_price:12,quantity:12,suggested_price:11},
      {market_hash_name:"Stable",min_price:1.1,median_price:1.2,quantity:30,suggested_price:1}]);
    let data = run("2026-11-07T00:00:00.000Z");
    assert.equal(data.find(x=>x.name==="Active").price_status,"live");

    write(lisPath, [{name:"Stable",price:1,count:10}]);
    write(spPath, [{market_hash_name:"Active",min_price:null,quantity:0,suggested_price:500},
      {market_hash_name:"Stable",min_price:1.1,median_price:1.2,quantity:30,suggested_price:1}]);
    data = run("2026-11-08T00:00:00.000Z");
    const recent = data.find(x=>x.name==="Active");
    assert.equal(recent.price_status,"last_seen");
    assert.equal(recent.min_price,10);
    assert.equal(recent.max_price,12);
    assert.equal(recent.last_seen_at,"2026-11-07T00:00:00.000Z");

    data = run("2026-11-11T00:00:00.000Z");
    assert.equal(data.some(x=>x.name==="Active"),false);
  } finally {
    fs.rmSync(dir, { recursive:true, force:true });
  }
});
