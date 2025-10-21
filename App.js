// App.js — VetLab Pro (Enhanced)
// Dependencies: victory-native, react-native-svg, @react-native-async-storage/async-storage, expo-clipboard, @expo/vector-icons, @react-native-picker/picker

import React, { useEffect, useState, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  FlatList,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { VictoryChart, VictoryLine, VictoryScatter, VictoryAxis, VictoryTheme } from "victory-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

/* -------------------- Helpers -------------------- */
const storageKey = "@vetlab_history_v2";

const fmt = (v, d = 4) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return Number(Number(v).toFixed(d));
};

const safeParse = (s) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const saveHistory = async (item) => {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(item);
    await AsyncStorage.setItem(storageKey, JSON.stringify(arr.slice(0, 300)));
    return true;
  } catch (e) {
    console.warn(e);
    return false;
  }
};

const loadHistory = async () => {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const removeHistoryItem = async (index) => {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const arr = raw ? JSON.parse(raw) : [];
    arr.splice(index, 1);
    await AsyncStorage.setItem(storageKey, JSON.stringify(arr));
    return true;
  } catch (e) {
    console.warn(e);
    return false;
  }
};

/* --------------- Input sanitation (numbers) --------------- */
/*
  filterNumeric: allow digits and single decimal point; optional leading minus not used here.
*/
function filterNumeric(text) {
  // keep digits and dot
  let s = text.replace(/[^\d.]/g, "");
  // remove extra dots
  const parts = s.split(".");
  if (parts.length > 2) {
    s = parts[0] + "." + parts.slice(1).join("");
  }
  // remove leading zeros weirdness but allow "0." start
  if (s.startsWith(".") ) s = "0" + s;
  return s;
}

/* ---------------------- Main App ---------------------- */
export default function App() {
  const [screen, setScreen] = useState("home");
  const [dark, setDark] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      const h = await loadHistory();
      setHistory(h);
    })();
  }, []);

  const pushHistory = async (entry) => {
    await saveHistory(entry);
    const h = await loadHistory();
    setHistory(h);
  };

  const styles = dark ? darkStyles : lightStyles;

  return (
<SafeAreaView style={styles.container}>
<View style={styles.header}>
<View style={{ flexDirection: "row", alignItems: "center" }}>
<MaterialIcons name="science" size={28} color={dark ? "#CFE4FF" : "#ffffff"} />
<Text style={styles.headerTitle}>VetLab Pro</Text>
</View>

<View style={{ flexDirection: "row", alignItems: "center" }}>
<Text style={styles.themeLabel}>تاریک</Text>
<Switch value={dark} onValueChange={setDark} />
</View>
</View>

      {screen === "home"&& (
<ScrollView contentContainerStyle={styles.home}>
<HomeCard icon={<Ionicons name="flask" size={22} color="#2b7cff" />} title="محاسبه محلول (M ↔ g / % w/v)" onPress={() => setScreen("solution")} />
<HomeCard icon={<Ionicons name="bar-chart" size={22} color="#f39c12" />} title="C1V1 = C2V2 / رقت" onPress={() => setScreen("c1v1")} />
<HomeCard icon={<Ionicons name="analytics" size={22} color="#9b59b6" />} title="رقت سریالی + نمودار" onPress={() => setScreen("serial")} />
<HomeCard icon={<Ionicons name="medkit" size={22} color="#27ae60" />} title="دوز و نرخ تزریق (mL/hr / drops/min)" onPress={() => setScreen("dose")} />
<HomeCard icon={<Ionicons name="swap-vertical" size={22} color="#e74c3c" />} title="تبدیل واحد جامع" onPress={() => setScreen("convert")} />
<HomeCard icon={<Ionicons name="layers" size={22} color="#16a085" />} title="ماژول بافر (pH)" onPress={() => setScreen("buffer")} />
<HomeCard icon={<Ionicons name="time" size={22} color="#34495e" />} title={`تاریخچه (${history.length})`} onPress={() => setScreen("history")} />
<Text style={styles.hint}>این نسخه UI/UX بهینه شده و تمامی محاسبات علمی متداول دامپزشکی را پوشش میدهد.</Text>
</ScrollView>
      )}

      {screen === "solution"&&<SolutionScreen onBack={() => setScreen("home")} pushHistory={pushHistory} styles={styles} />}
      {screen === "c1v1"&&<C1V1Screen onBack={() => setScreen("home")} pushHistory={pushHistory} styles={styles} />}
      {screen === "serial"&&<SerialScreen onBack={() => setScreen("home")} pushHistory={pushHistory} styles={styles} />}
      {screen === "dose"&&<DoseScreen onBack={() => setScreen("home")} pushHistory={pushHistory} styles={styles} />}
      {screen === "convert"&&<ConvertScreen onBack={() => setScreen("home")} pushHistory={pushHistory} styles={styles} />}
      {screen === "buffer"&&<BufferScreen onBack={() => setScreen("home")} pushHistory={pushHistory} styles={styles} />}
      {screen === "history"&&<HistoryScreen onBack={() => setScreen("home")} history={history} setHistory={setHistory} styles={styles} />}

<View style={styles.footer}>
<Text style={styles.footerText}>ساختهشده برای دانشجوی دامپزشکی • VetLab Pro</Text>
</View>
</SafeAreaView>
  );
}

/* ---------------------- Home Card ---------------------- */
function HomeCard({ icon, title, onPress }) {
  return (
<TouchableOpacity style={base.cardShadow} onPress={onPress} activeOpacity={0.85}>
<View style={base.cardRow}>
<View style={base.iconWrap}>{icon}</View>
<View style={{ flex: 1 }}>
<Text style={base.cardTitle}>{title}</Text>
<Text style={base.cardSub}>لمس کن برای باز کردن</Text>
</View>
<Ionicons name="chevron-forward" size={22} color="#999" />
</View>
</TouchableOpacity>
  );
}

/* ---------------------- Screens ---------------------- */

/* SolutionScreen: M -> g and %w/v */
function SolutionScreen({ onBack, pushHistory, styles }) {
  const [M, setM] = useState("0.1");
  const [vol, setVol] = useState("100"); // mL
  const [mw, setMw] = useState("58.44");
  const [res, setRes] = useState(null);

  const [perc, setPerc] = useState("5");
  const [vol2, setVol2] = useState("100");

  function calcMtoG() {
    const m = safeParse(M);
    const v = safeParse(vol);
    const mwv = safeParse(mw);
    if (m === null || v === null || mwv === null) {
      Alert.alert("ورودی نامعتبر", "لطفاً مقادیر را به صورت عددی وارد کنید.");
      return;
    }
    const g = m * (v / 1000.0) * mwv;
    setRes(g);
    const sentence = `برای تهیه ${fmt(g)} g از محلول ${M} M به حجم ${vol} mL و جرم مولی ${mw} g/mol نیاز است.`;
    pushHistory({ type: "M→g", time: Date.now(), sentence, data: { M, vol, mw, result: g } });
  }
  function calcPerc() {
    const p = safeParse(perc);
    const v = safeParse(vol2);
    if (p === null || v === null) {
      Alert.alert("ورودی نامعتبر", "لطفاً مقادیر صحیح وارد کنید.");
      return;
    }
    const g = p * v / 100.0;
    const sentence = `برای تهیه ${fmt(g)} g از محلول ${p}% w/v در حجم ${v} mL نیاز است.`;
    pushHistory({ type: "%w/v", time: Date.now(), sentence, data: { perc: p, vol2: v, result: g } });
    Alert.alert("نتیجه", `${fmt(g)} g مورد نیاز است`);
  }

  return (
<ScrollView style={styles.screen}>
<Nav title="محاسبه محلول" onBack={onBack} styles={styles} />
<CardForm>
<Text style={styles.label}>مولاریته (M)</Text>
<TextInput style={styles.input} keyboardType="numeric" value={M} onChangeText={(t) => setM(filterNumeric(t))} />
<Text style={styles.label}>حجم (mL)</Text>
<TextInput style={styles.input} keyboardType="numeric" value={vol} onChangeText={(t) => setVol(filterNumeric(t))} />
<Text style={styles.label}>جرم مولی (g/mol)</Text>
<TextInput style={styles.input} keyboardType="numeric" value={mw} onChangeText={(t) => setMw(filterNumeric(t))} />
<TouchableOpacity style={styles.btn} onPress={calcMtoG}><Text style={styles.btnText}>محاسبه</Text></TouchableOpacity>
        {res !== null &&<Text style={styles.result}>مقدار مورد نیاز: {fmt(res)} g</Text>}
</CardForm>

<CardForm>
<Text style={styles.label}>درصد (% w/v)</Text>
<TextInput style={styles.input} keyboardType="numeric" value={perc} onChangeText={(t) => setPerc(filterNumeric(t))} />
<Text style={styles.label}>حجم نهایی (mL)</Text>
<TextInput style={styles.input} keyboardType="numeric" value={vol2} onChangeText={(t) => setVol2(filterNumeric(t))} />
<TouchableOpacity style={styles.btn} onPress={calcPerc}><Text style={styles.btnText}>محاسبه</Text></TouchableOpacity>
</CardForm>
</ScrollView>
  );
}

/* C1V1 */
function C1V1Screen({ onBack, pushHistory, styles }) {
  const [C1, setC1] = useState("1");
  const [V1, setV1] = useState("100");
  const [C2, setC2] = useState("");
  const [V2, setV2] = useState("");
  const [out, setOut] = useState("");

  function calc() {
    const c1 = safeParse(C1);
    const v1 = safeParse(V1);
    const c2 = C2.trim() ? safeParse(C2) : null;
    const v2 = V2.trim() ? safeParse(V2) : null;
    if (c1 === null || v1 === null) return setOut("C1 و V1 را درست وارد کنید.");
    if (c2 === null && v2 === null) return setOut("یکی از C2 یا V2 را وارد کنید.");
    if (c2 === null) {
      const res = (c1 * v1) / v2;
      const sentence = `با C1=${c1} و V1=${v1}، غلظت نهایی C2 ≈ ${fmt(res)} (همان واحد) است.`;
      pushHistory({ type: "C1V1", time: Date.now(), sentence, data: { C1: c1, V1: v1, V2: v2, result: res } });
      setOut(`C2 ≈ ${fmt(res)}`);
    } else {
      const res = (c1 * v1) / c2;
      const sentence = `با C1=${c1} و V1=${v1} و C2=${c2} حجم نهایی V2 ≈ ${fmt(res)} است.`;
      pushHistory({ type: "C1V1", time: Date.now(), sentence, data: { C1: c1, V1: v1, C2: c2, result: res } });
      setOut(`V2 ≈ ${fmt(res)} (همان واحد)`);
    }
  }

  return (
<View style={styles.screen}>
<Nav title="C1V1 = C2V2" onBack={onBack} styles={styles} />
<CardForm>
<Text style={styles.label}>C1</Text>
<TextInput style={styles.input} value={C1} onChangeText={(t) => setC1(filterNumeric(t))} keyboardType="numeric" />
<Text style={styles.label}>V1 (mL)</Text>
<TextInput style={styles.input} value={V1} onChangeText={(t) => setV1(filterNumeric(t))} keyboardType="numeric" />
<Text style={styles.label}>C2 (یا خالی)</Text>
<TextInput style={styles.input} value={C2} onChangeText={(t) => setC2(filterNumeric(t))} keyboardType="numeric" />
<Text style={styles.label}>V2 (یا خالی mL)</Text>
<TextInput style={styles.input} value={V2} onChangeText={(t) => setV2(filterNumeric(t))} keyboardType="numeric" />
<TouchableOpacity style={styles.btn} onPress={calc}><Text style={styles.btnText}>محاسبه</Text></TouchableOpacity>
<Text style={{ marginTop: 12 }}>{out}</Text>
</CardForm>
</View>
  );
}

/* Serial dilution + chart */
function SerialScreen({ onBack, pushHistory, styles }) {
  const [init, setInit] = useState("1");
  const [factor, setFactor] = useState("10");
  const [steps, setSteps] = useState("6");
  const [data, setData] = useState([]);

  function gen() {
    const i = safeParse(init);
    const f = safeParse(factor);
    const n = safeParse(steps);
    if (i === null || f === null || n === null) {
      Alert.alert("ورودی نامعتبر", "مقادیر را درست وارد کنید.");
      return;
    }
    const arr = [];
    let c = i;
    for (let k = 0; k <= n; k++) {
      arr.push({ x: k, y: c });
      c = c / f;
    }
    setData(arr);
    const sentence = `رقت سریالی: شروع از ${i}, عامل ${f}, ${n} مرحله — ${arr.map((it) => `${it.x}:${fmt(it.y)}`).join(", ")}`;
    pushHistory({ type: "serial", time: Date.now(), sentence, data: { init: i, factor: f, steps: n, result: arr } });
  }

  return (
<ScrollView style={styles.screen}>
<Nav title="رقت سریالی" onBack={onBack} styles={styles} />
<CardForm>
<Text style={styles.label}>غلظت اولیه</Text>
<TextInput style={styles.input} keyboardType="numeric" value={init} onChangeText={(t) => setInit(filterNumeric(t))} />
<Text style={styles.label}>عامل رقت</Text>
<TextInput style={styles.input} keyboardType="numeric" value={factor} onChangeText={(t) => setFactor(filterNumeric(t))} />
<Text style={styles.label}>تعداد مراحل</Text>
<TextInput style={styles.input} keyboardType="numeric" value={steps} onChangeText={(t) => setSteps(filterNumeric(t))} />
<TouchableOpacity style={styles.btn} onPress={gen}><Text style={styles.btnText}>ایجاد نمودار</Text></TouchableOpacity>

        {data.length > 0 && (
<View style={{ marginTop: 12 }}>
<VictoryChart theme={VictoryTheme.material} domainPadding={{ x: 20 }}>
<VictoryAxis dependentAxis tickFormat={(t) => `${t}`} />
<VictoryAxis />
<VictoryLine data={data} interpolation="natural" />
<VictoryScatter data={data} size={4} />
</VictoryChart>

<View style={{ marginTop: 8 }}>
              {data.map((it) => (
<View key={it.x} style={{ padding: 8, backgroundColor: styles.cardBg, marginBottom: 6, borderRadius: 8 }}>
<Text style={{ color: styles.textColor }}>{`مرحله ${it.x} — غلظت: ${fmt(it.y)}`}</Text>
</View>
              ))}
</View>
</View>
        )}
</CardForm>
</ScrollView>
  );
}

/* DoseScreen with infusion rate and drops/min */
function DoseScreen({ onBack, pushHistory, styles }) {
  const [dose, setDose] = useState("5"); // mg/kg
  const [wt, setWt] = useState("10"); // kg
  const [conc, setConc] = useState("50"); // mg/mL - concentration of stock
  const [infusionMin, setInfusionMin] = useState("60"); // infusion duration in minutes
  const [dropFactor, setDropFactor] = useState("20"); // gtt/mL
  const [out, setOut] = useState("");

  function calc() {
    const d = safeParse(dose);
    const w = safeParse(wt);
    const c = safeParse(conc);
    const tmin = safeParse(infusionMin);
    const gtt = safeParse(dropFactor);
    if (d === null || w === null) {
      setOut("لطفاً دوز و وزن را وارد کنید.");
      return;
    }
    const mgTotal = d * w;
    let resultTxt = `دوز کل: ${fmt(mgTotal)} mg`;
    if (c && c > 0) {
      const vol_mL = mgTotal / c;
      resultTxt += `\nحجم موردنیاز از محلول: ${fmt(vol_mL, 3)} mL (غلظت ${c} mg/mL)`;
      if (tmin && tmin > 0) {
        const ml_per_hr = (vol_mL / tmin) * 60;
        const drops_per_min = (vol_mL * gtt) / tmin;
        resultTxt += `\nنرخ تزریق: ${fmt(ml_per_hr, 3)} mL/hr — ${Math.round(drops_per_min)} drops/min (با drop factor ${gtt} gtt/mL)`;
      }
    }
    setOut(resultTxt);
    const sentence = `دوز ${d} mg/kg برای وزن ${w} kg → ${fmt(mgTotal)} mg؛ حجم از محلول ${c} mg/mL → ${fmt(mgTotal / c, 3)} mL؛ مدت ${tmin} min → ${out}`;
    pushHistory({ type: "dose", time: Date.now(), sentence, data: { dose: d, wt: w, conc: c, infusionMin: tmin, result: resultTxt } });
  }

  return (
<ScrollView style={styles.screen}>
<Nav title="دوز و نرخ تزریق" onBack={onBack} styles={styles} />
<CardForm>
<Text style={styles.label}>دوز (mg/kg)</Text>
<TextInput style={styles.input} keyboardType="numeric" value={dose} onChangeText={(t) => setDose(filterNumeric(t))} />
<Text style={styles.label}>وزن حیوان (kg)</Text>
<TextInput style={styles.input} keyboardType="numeric" value={wt} onChangeText={(t) => setWt(filterNumeric(t))} />
<Text style={styles.label}>غلظت محلول دارو (mg/mL)</Text>
<TextInput style={styles.input} keyboardType="numeric" value={conc} onChangeText={(t) => setConc(filterNumeric(t))} />
<Text style={styles.label}>مدت تزریق (دقیقه)</Text>
<TextInput style={styles.input} keyboardType="numeric" value={infusionMin} onChangeText={(t) => setInfusionMin(filterNumeric(t))} />
<Text style={styles.label}>Drop factor (gtt/mL)</Text>
<TextInput style={styles.input} keyboardType="numeric" value={dropFactor} onChangeText={(t) => setDropFactor(filterNumeric(t))} />
<TouchableOpacity style={styles.btn} onPress={calc}><Text style={styles.btnText}>محاسبه</Text></TouchableOpacity>
<Text style={{ marginTop: 12, whiteSpace: "pre-line" }}>{out}</Text>
</CardForm>
</ScrollView>
  );
}

/* ConvertScreen: mass, volume, temperature, molarity */
function ConvertScreen({ onBack, pushHistory, styles }) {
  const [category, setCategory] = useState("mass"); // mass, volume, temp, molar
  const [value, setValue] = useState("1000");
  const [from, setFrom] = useState("mg");
  const [to, setTo] = useState("g");
  const [mw, setMw] = useState("58.44"); // for molar conversions if needed
  const [result, setResult] = useState(null);

  const massUnits = ["kg", "g", "mg", "ug"];
  const volUnits = ["L", "mL", "uL"];
  const tempUnits = ["°C", "°F", "K"];
  const molUnits = ["M", "mM", "µM"];

  useEffect(() => {
    // default units per category
    if (category === "mass") {
      setFrom("mg");
      setTo("g");
    } else if (category === "volume") {
      setFrom("mL");
      setTo("L");
    } else if (category === "temp") {
      setFrom("°C");
      setTo("°F");
    } else {
      setFrom("M");
      setTo("mM");
    }
  }, [category]);

  function convert() {
    const v = safeParse(value);
    if (v === null) {
      Alert.alert("ورودی نامعتبر", "مقدار عددی وارد کنید.");
      return;
    }
    let out = null;
    if (category === "mass") {
      const conv = { kg: 1000, g: 1, mg: 1e-3, ug: 1e-6 };
      const valG = v * conv[from];
      out = valG / conv[to];
    } else if (category === "volume") {
      const conv = { L: 1, mL: 1e-3, uL: 1e-6 };
      const valL = v * conv[from];
      out = valL / conv[to];
    } else if (category === "temp") {
      if (from === "°C"&& to === "°F") out = v * 9 / 5 + 32;
      else if (from === "°F"&& to === "°C") out = (v - 32) * 5 / 9;
      else if (from === "°C"&& to === "K") out = v + 273.15;
      else if (from === "K"&& to === "°C") out = v - 273.15;
      else if (from === "°F"&& to === "K") out = (v - 32) * 5 / 9 + 273.15;
      else if (from === "K"&& to === "°F") out = (v - 273.15) * 9 / 5 + 32;
      else out = v;
    } else if (category === "molar") {
      // M, mM, µM simple scale; optionally convert mass <-> molarity if MW given
      const scale = { M: 1, mM: 1e-3, "µM": 1e-6 };
      out = v * (scale[from] / scale[to]);
      // if user wants mass <-> molarity: not in this simple converter; would need volume & MW
    }
    setResult(out);
    const sentence = `تبدیل: ${v} ${from} → ${fmt(out)} ${to} (دسته: ${category})`;
    pushHistory({ type: "convert", time: Date.now(), sentence, data: { category, value: v, from, to, result: out } });
  }

  // picker options helper
  const units = useMemo(() => {
    if (category === "mass") return massUnits;
    if (category === "volume") return volUnits;
    if (category === "temp") return tempUnits;
    return molUnits;
  }, [category]);

  return (
<ScrollView style={styles.screen}>
<Nav title="تبدیل واحد جامع" onBack={onBack} styles={styles} />
<CardForm>
<Text style={styles.label}>دستهٔ تبدیل</Text>
<View style={styles.pickerRow}>
<TouchableOpacity style={[styles.tag, category === "mass"&& styles.tagActive]} onPress={() => setCategory("mass")}>
<Text style={category === "mass" ? styles.tagTextActive : styles.tagText}>جرم</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.tag, category === "volume"&& styles.tagActive]} onPress={() => setCategory("volume")}>
<Text style={category === "volume" ? styles.tagTextActive : styles.tagText}>حجم</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.tag, category === "temp"&& styles.tagActive]} onPress={() => setCategory("temp")}>
<Text style={category === "temp" ? styles.tagTextActive : styles.tagText}>دما</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.tag, category === "molar"&& styles.tagActive]} onPress={() => setCategory("molar")}>
<Text style={category === "molar" ? styles.tagTextActive : styles.tagText}>غلظت (M)</Text>
</TouchableOpacity>
</View>

<Text style={styles.label}>مقدار</Text>
<TextInput style={styles.input} keyboardType="numeric" value={value} onChangeText={(t) => setValue(filterNumeric(t))} />

<Text style={styles.label}>از واحد</Text>
<View style={styles.pickerBox}>
<Picker selectedValue={from} onValueChange={(v) => setFrom(v)} mode="dropdown">
            {units.map((u) =><Picker.Item key={u} label={u} value={u} />)}
</Picker>
</View>

<Text style={styles.label}>به واحد</Text>
<View style={styles.pickerBox}>
<Picker selectedValue={to} onValueChange={(v) => setTo(v)} mode="dropdown">
            {units.map((u) =><Picker.Item key={u} label={u} value={u} />)}
</Picker>
</View>

        {(category === "molar") && (
<>
<Text style={styles.label}>جرم مولی (g/mol) — فقط در صورت نیاز</Text>
<TextInput style={styles.input} keyboardType="numeric" value={mw} onChangeText={(t) => setMw(filterNumeric(t))} />
</>
        )}

<TouchableOpacity style={styles.btn} onPress={convert}><Text style={styles.btnText}>تبدیل</Text></TouchableOpacity>
        {result !== null &&<Text style={styles.result}>نتیجه: {fmt(result)}</Text>}
</CardForm>
</ScrollView>
  );
}

/* BufferScreen: Henderson-Hasselbalch */
function BufferScreen({ onBack, pushHistory, styles }) {
  const [pKa, setPka] = useState("");
  const [ratio, setRatio] = useState("1"); // A-/HA ratio
  const [phTarget, setPhTarget] = useState("");
  const [mode, setMode] = useState("calcPh"); // calcPh or calcRatio
  const [result, setResult] = useState(null);

  function calcPh() {
    const p = safeParse(pKa);
    const r = safeParse(ratio);
    if (p === null || r === null) {
      Alert.alert("ورودی نامعتبر", "pKa و نسبت را به صورت عدد وارد کنید.");
      return;
    }
    const ph = p + Math.log10(r);
    setResult(ph);
    const sentence = `با pKa=${p} و نسبت [A-]/[HA]=${r} → pH ≈ ${fmt(ph, 3)} (Henderson–Hasselbalch).`;
    pushHistory({ type: "buffer_ph", time: Date.now(), sentence, data: { pKa: p, ratio: r, ph } });
  }

  function calcRatioFromTarget() {
    const p = safeParse(pKa);
    const ph = safeParse(phTarget);
    if (p === null || ph === null) {
      Alert.alert("ورودی نامعتبر", "pKa و pH هدف را وارد کنید.");
      return;
    }
    const ratioNeeded = Math.pow(10, ph - p);
    setResult(ratioNeeded);
    const sentence = `برای رسیدن به pH=${ph} با pKa=${p} نیاز است [A-]/[HA] ≈ ${fmt(ratioNeeded, 4)}.`;
    pushHistory({ type: "buffer_ratio", time: Date.now(), sentence, data: { pKa: p, targetPh: ph, ratio: ratioNeeded } });
  }

  return (
<ScrollView style={styles.screen}>
<Nav title="ماژول بافر (H-H)" onBack={onBack} styles={styles} />
<CardForm>
<Text style={styles.label}>عمل</Text>
<View style={styles.pickerRow}>
<TouchableOpacity style={[styles.tag, mode === "calcPh"&& styles.tagActive]} onPress={() => setMode("calcPh")}><Text style={mode === "calcPh" ? styles.tagTextActive : styles.tagText}>محاسبه pH از pKa و نسبت</Text></TouchableOpacity>
<TouchableOpacity style={[styles.tag, mode === "calcRatio"&& styles.tagActive]} onPress={() => setMode("calcRatio")}><Text style={mode === "calcRatio" ? styles.tagTextActive : styles.tagText}>محاسبه نسبت از pH هدف</Text></TouchableOpacity>
</View>

<Text style={styles.label}>pKa</Text>
<TextInput style={styles.input} keyboardType="numeric" value={pKa} onChangeText={(t) => setPka(filterNumeric(t))} />

        {mode === "calcPh" ? (
<>
<Text style={styles.label}>نسبت [A-] / [HA]</Text>
<TextInput style={styles.input} keyboardType="numeric" value={ratio} onChangeText={(t) => setRatio(filterNumeric(t))} />
<TouchableOpacity style={styles.btn} onPress={calcPh}><Text style={styles.btnText}>محاسبه pH</Text></TouchableOpacity>
</>
        ) : (
<>
<Text style={styles.label}>pH هدف</Text>
<TextInput style={styles.input} keyboardType="numeric" value={phTarget} onChangeText={(t) => setPhTarget(filterNumeric(t))} />
<TouchableOpacity style={styles.btn} onPress={calcRatioFromTarget}><Text style={styles.btnText}>محاسبه نسبت</Text></TouchableOpacity>
</>
        )}

        {result !== null &&<Text style={styles.result}>نتیجه: {fmt(result, 4)}</Text>}
</CardForm>
</ScrollView>
  );
}

/* HistoryScreen: readable sentences, delete single */
function HistoryScreen({ onBack, history, setHistory, styles }) {
  async function refresh() {
    const h = await loadHistory();
    setHistory(h);
  }

  async function deleteOne(index) {
    Alert.alert("تایید حذف", "آیا میخواهید این مورد را حذف کنید؟", [
      { text: "خیر" },
      {
        text: "بله",
        onPress: async () => {
          await removeHistoryItem(index);
          refresh();
        },
      },
    ]);
  }

  function exportCSV() {
    const header = ["نوع", "زمان", "توضیح"];
    const rows = history.map((h) => [h.type, new Date(h.time).toLocaleString(), h.sentence ? h.sentence : JSON.stringify(h.data)]);
    const csv = [header.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    Clipboard.setStringAsync(csv);
    Alert.alert("خروجی CSV", "متن CSV در کلیپبورد کپی شد.");
  }

  return (
<View style={styles.screen}>
<Nav title="تاریخچه محاسبات" onBack={onBack} styles={styles} />
<View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
<TouchableOpacity style={[styles.smallBtn]} onPress={refresh}><Text>بازخوانی</Text></TouchableOpacity>
<TouchableOpacity style={[styles.smallBtn, { backgroundColor: "#eef" }]} onPress={exportCSV}><Text>خروجی CSV</Text></TouchableOpacity>
</View>

      {history.length === 0 ? (
<Text style={{ color: styles.subText }}>تاریخچهای وجود ندارد.</Text>
      ) : (
<FlatList
          data={history}
          keyExtractor={(item, idx) => String(idx)}
          renderItem={({ item, index }) => (
<View style={[styles.histItem, styles.cardBgBox]}>
<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
<View style={{ flex: 1 }}>
<Text style={[styles.histTitle]}>{item.type} — {new Date(item.time).toLocaleString()}</Text>
<Text style={[styles.histText]}>{item.sentence ? item.sentence : JSON.stringify(item.data)}</Text>
</View>
<View style={{ marginLeft: 8 }}>
<TouchableOpacity style={styles.iconBtn} onPress={() => deleteOne(index)}><Ionicons name="trash" size={20} color="#ff5555" /></TouchableOpacity>
</View>
</View>
</View>
          )}
        />
      )}
</View>
  );
}

/* Nav and small UI components */
function Nav({ title, onBack }) {
  return (
<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
<TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={22} color="#2b7cff" /></TouchableOpacity>
<Text style={{ fontWeight: "800", fontSize: 16 }}>{title}</Text>
<View style={{ width: 24 }} />
</View>
  );
}

function CardForm({ children }) {
  return <View style={{ marginBottom: 14 }}>{children}</View>;
}

/* ---------------- Styles ---------------- */
const base = StyleSheet.create({
  cardShadow: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginVertical: 8,
    padding: 12,
    // nice shadow cross-platform
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  iconWrap: { width: 48, height: 48, borderRadius: 10, backgroundColor: "#f5f9ff", justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  cardSub: { color: "#777", marginTop: 4 },
});

const lightStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f6fb" },
  header: { padding: 14, backgroundColor: "#2b7cff", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 18, marginLeft: 8 },
  themeLabel: { color: "#fff", marginRight: 8 },
  home: { padding: 14 },
  hint: { color: "#666", marginTop: 8, textAlign: "center" },
  footer: { padding: 8, alignItems: "center", borderTopWidth: 1, borderTopColor: "#eee" },
  footerText: { color: "#666", fontSize: 12 },

  screen: { padding: 14 },
  label: { fontWeight: "700", marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#e6eef9", padding: 10, borderRadius: 8, marginTop: 6, backgroundColor: "#fff" },
  btn: { backgroundColor: "#2b7cff", padding: 12, borderRadius: 10, marginTop: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800" },
  result: { marginTop: 10, fontWeight: "700" },
  sep: { height: 1, backgroundColor: "#eee", marginVertical: 12 },

  pickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  tag: { padding: 8, borderRadius: 8, backgroundColor: "#f2f5fb", marginRight: 8, marginBottom: 8 },
  tagActive: { backgroundColor: "#2b7cff" },
  tagText: { color: "#333" },
  tagTextActive: { color: "#fff" },

  pickerBox: { borderWidth: 1, borderColor: "#e6eef9", borderRadius: 8, marginTop: 6, overflow: "hidden", backgroundColor: "#fff" },

  smallBtn: { padding: 8, borderRadius: 8, backgroundColor: "#ddd" },

  cardBg: "#fafafa",
  textColor: "#222",
  subText: "#888",

  histItem: { marginBottom: 10, borderRadius: 10, padding: 10 },
  histTitle: { fontWeight: "800" },
  histText: { marginTop: 6, color: "#333" },

  iconBtn: { padding: 6, borderRadius: 6, backgroundColor: "#fff" },
});

const darkStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#071124" },
  header: { padding: 14, backgroundColor: "#071a2b", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "#cfe4ff", fontWeight: "800", fontSize: 18, marginLeft: 8 },
  themeLabel: { color: "#cfe4ff", marginRight: 8 },

  home: { padding: 14 },
  hint: { color: "#9aa3b2", marginTop: 8, textAlign: "center" },
  footer: { padding: 8, alignItems: "center", borderTopWidth: 1, borderTopColor: "#0b2030" },
  footerText: { color: "#9aa3b2", fontSize: 12 },

  screen: { padding: 14 },
  label: { fontWeight: "700", marginTop: 8, color: "#d8e8ff" },
  input: { borderWidth: 1, borderColor: "#12304a", padding: 10, borderRadius: 8, marginTop: 6, backgroundColor: "#071124", color: "#fff" },
  btn: { backgroundColor: "#1f6fff", padding: 12, borderRadius: 10, marginTop: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800" },
  result: { marginTop: 10, fontWeight: "700", color: "#d8e8ff" },
  sep: { height: 1, backgroundColor: "#12304a", marginVertical: 12 },

  pickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  tag: { padding: 8, borderRadius: 8, backgroundColor: "#071a2b", marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: "#0b2030" },
  tagActive: { backgroundColor: "#1f6fff" },
  tagText: { color: "#bcd4ff" },
  tagTextActive: { color: "#fff" },

  pickerBox: { borderWidth: 1, borderColor: "#12304a", borderRadius: 8, marginTop: 6, overflow: "hidden", backgroundColor: "#071124" },

  smallBtn: { padding: 8, borderRadius: 8, backgroundColor: "#12304a" },

  cardBg: "#0b1220",
  textColor: "#cfe4ff",
  subText: "#9aa3b2",

  histItem: { marginBottom: 10, borderRadius: 10, padding: 10 },
  histTitle: { fontWeight: "800", color: "#cfe4ff" },
  histText: { marginTop: 6, color: "#d8e8ff" },

  iconBtn: { padding: 6, borderRadius: 6, backgroundColor: "#071124" },
});

/* -------------------- End -------------------- */
