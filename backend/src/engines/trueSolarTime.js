/**
 * trueSolarTime.js — 真太陽時校正（JS 版，供擇日本命用）
 * 與後端 Python solar_time_local.py 同演算法：經度修正 + 均時差。
 * 城市以經度為關鍵（每 1°≈4 分鐘）。台灣 22 縣市精確，另含主要兩岸城市。
 */

// 台灣 22 縣市 + 主要城市經度（東經）
const CITY_LON = {
  // 台灣
  台北: 121.5637, 臺北: 121.5637, 新北: 121.4657, 基隆: 121.7392, 桃園: 121.301,
  新竹市: 120.9686, 新竹: 121.0, 新竹縣: 121.0, 苗栗: 120.8214, 台中: 120.6839, 臺中: 120.6839,
  彰化: 120.5417, 南投: 120.6869, 雲林: 120.4313, 嘉義市: 120.4491, 嘉義: 120.2926, 嘉義縣: 120.2926,
  台南: 120.227, 臺南: 120.227, 高雄: 120.3014, 屏東: 120.488, 宜蘭: 121.7539, 花蓮: 121.6015,
  台東: 121.1444, 臺東: 121.1444, 澎湖: 119.5793, 金門: 118.3171, 馬祖: 119.9397, 連江: 119.9397,
  // 兩岸 / 港澳主要城市
  香港: 114.1694, 澳門: 113.5439, 澳门: 113.5439, 北京: 116.4074, 上海: 121.4737,
  廣州: 113.2644, 广州: 113.2644, 深圳: 114.0579, 成都: 104.0668, 重慶: 106.5516,
};

const STD_LON = 120; // UTC+8 標準經度

export function cityLongitude(city) {
  if (!city) return null;
  const n = String(city).replace('臺', '台').trim();
  if (CITY_LON[city] != null) return CITY_LON[city];
  if (CITY_LON[n] != null) return CITY_LON[n];
  // 去掉縣/市再試
  const base = n.replace(/[縣市]$/, '');
  if (CITY_LON[base] != null) return CITY_LON[base];
  for (const k of Object.keys(CITY_LON)) {
    if (n.startsWith(k) || n.includes(k)) return CITY_LON[k];
  }
  return null;
}

/** 均時差（分鐘），doy = 一年中第幾天。 */
export function equationOfTime(doy) {
  const B = ((360 / 365) * (doy - 81) * Math.PI) / 180;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

function dayOfYear(y, m, d) {
  const start = Date.UTC(y, 0, 0);
  const cur = Date.UTC(y, m - 1, d);
  return Math.floor((cur - start) / 86400000);
}

/**
 * 回傳真太陽時校正後的日期時間與位移。
 * @returns {{y,m,d,h,min,deltaMin,longitude,known:boolean}}
 */
export function toTrueSolar({ year, month, day, hour = 12, minute = 0, city }) {
  const lon = cityLongitude(city);
  const longitude = lon == null ? STD_LON : lon;
  const longCorr = (longitude - STD_LON) * 4; // 分鐘
  const eot = equationOfTime(dayOfYear(year, month, day));
  const deltaMin = Math.round(longCorr + eot);

  const dt = new Date(year, month - 1, day, hour, minute, 0);
  dt.setMinutes(dt.getMinutes() + deltaMin);
  return {
    y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate(),
    h: dt.getHours(), min: dt.getMinutes(),
    deltaMin, longitude, known: lon != null,
  };
}
