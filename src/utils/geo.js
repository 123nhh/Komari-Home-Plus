// 地区 → 国旗 emoji 映射
// 覆盖常见地区中文名 / 英文名 / 城市名 / ISO 两位代码

const REGION_RULES = [
  { re: /\bhk\b|hong.?kong|香港|港区/i, code: 'HK' },
  { re: /\btw\b|taiwan|台湾|臺湾/i, code: 'TW' },
  { re: /\bmo\b|macau|macao|澳门/i, code: 'MO' },
  { re: /\bjp\b|japan|日本|东京|tokyo|大阪|osaka/i, code: 'JP' },
  { re: /\bsg\b|singapore|新加坡/i, code: 'SG' },
  { re: /\bkr\b|korea|韩国|首尔|seoul|釜山|busan/i, code: 'KR' },
  { re: /\bus\b|united states|\busa\b|美国|洛杉矶|los angeles|圣何塞|san jose|西雅图|seattle|波特兰|portland|凤凰城|phoenix|达拉斯|dallas|芝加哥|chicago|纽约|new york|迈阿密|miami|拉斯维加斯|las vegas|盐湖城|salt lake|丹佛|denver|堪萨斯|kansas|硅谷|silicon valley|圣克拉拉|santa clara|弗里蒙特|fremont|塔科马|tacoma|洛杉矶|火奴鲁鲁|honolulu/i, code: 'US' },
  { re: /\bde\b|germany|德国|法兰克福|frankfurt|杜塞尔多夫|dusseldorf|杜塞尔多夫|慕尼黑|munich|柏林|berlin|纽伦堡|nuremberg|斯图加特|stuttgart|汉堡|hamburg|纽伦堡/i, code: 'DE' },
  { re: /\bgb\b|\buk\b|united kingdom|britain|英国|伦敦|london|曼彻斯特|manchester|爱丁堡|edinburgh|格拉斯哥|glasgow/i, code: 'GB' },
  { re: /\bfr\b|france|法国|巴黎|paris|马赛|marseille|里昂|lyon/i, code: 'FR' },
  { re: /\bnl\b|netherlands|holland|荷兰|阿姆斯特丹|amsterdam/i, code: 'NL' },
  { re: /\bru\b|russia|俄罗斯|莫斯科|moscow|圣彼得堡|petersburg|saint-petersburg/i, code: 'RU' },
  { re: /\bau\b|australia|澳大利亚|悉尼|sydney|墨尔本|melbourne|珀斯|perth|布里斯班|brisbane/i, code: 'AU' },
  { re: /\bca\b|canada|加拿大|多伦多|toronto|温哥华|vancouver|蒙特利尔|montreal|卡尔加里|calgary/i, code: 'CA' },
  { re: /\bin\b|india|印度|孟买|mumbai|班加罗尔|bangalore|新德里|delhi|加尔各答|kolkata/i, code: 'IN' },
  { re: /\bid\b|indonesia|印尼|印度尼西亚|雅加达|jakarta|巴厘岛|bali/i, code: 'ID' },
  { re: /\bmy\b|malaysia|马来西亚|吉隆坡|kuala lumpur|槟城|penang/i, code: 'MY' },
  { re: /\bth\b|thailand|泰国|曼谷|bangkok/i, code: 'TH' },
  { re: /\bvn\b|vietnam|越南|胡志明|ho chi minh|河内|hanoi/i, code: 'VN' },
  { re: /\bph\b|philippines|菲律宾|马尼拉|manila/i, code: 'PH' },
  { re: /\bbr\b|brazil|巴西|圣保罗|sao paulo|里约|rio/i, code: 'BR' },
  { re: /\bit\b|italy|意大利|米兰|milan|罗马|rome|都灵|turino/i, code: 'IT' },
  { re: /\bes\b|spain|西班牙|马德里|madrid|巴塞罗那|barcelona|塞维利亚|seville/i, code: 'ES' },
  { re: /\bpl\b|poland|波兰|华沙|warsaw|克拉科夫|krakow|格但斯克|gdansk/i, code: 'PL' },
  { re: /\bfi\b|finland|芬兰|赫尔辛基|helsinki/i, code: 'FI' },
  { re: /\bua\b|ukraine|乌克兰|基辅|kyiv|kiev/i, code: 'UA' },
  { re: /\bcn\b|china|中国|上海|shanghai|北京|beijing|广州|guangzhou|深圳|shenzhen|杭州|hangzhou|成都|chengdu|青岛|qingdao|南京|nanjing|武汉|wuhan|泉州|quanzhou|重庆|chongqing|西安|xian|苏州|suzhou|无锡|wuxi|大连|dalian|佛山|foshan|东莞|dongguan|天津|tianjin/i, code: 'CN' },
  { re: /\btr\b|turkey|土耳其|伊斯坦布尔|istanbul/i, code: 'TR' },
  { re: /\bbg\b|bulgaria|保加利亚|索菲亚|sofia/i, code: 'BG' },
  { re: /\bro\b|romania|罗马尼亚|布加勒斯特|bucharest/i, code: 'RO' },
  { re: /\bat\b|austria|奥地利|维也纳|vienna/i, code: 'AT' },
  { re: /\bch\b|switzerland|瑞士|苏黎世|zurich/i, code: 'CH' },
  { re: /\bse\b|sweden|瑞典|斯德哥尔摩|stockholm/i, code: 'SE' },
  { re: /\bno\b|norway|挪威|奥斯陆|oslo/i, code: 'NO' },
  { re: /\bdk\b|denmark|丹麦|哥本哈根|copenhagen/i, code: 'DK' },
  { re: /\bie\b|ireland|爱尔兰|都柏林|dublin/i, code: 'IE' },
  { re: /\bpt\b|portugal|葡萄牙|里斯本|lisbon/i, code: 'PT' },
  { re: /\bcz\b|czech|捷克|布拉格|prague/i, code: 'CZ' },
  { re: /\bhu\b|hungary|匈牙利|布达佩斯|budapest/i, code: 'HU' },
  { re: /\bza\b|south africa|南非|约翰内斯堡|johannesburg|开普敦|cape town/i, code: 'ZA' },
  { re: /\bmx\b|mexico|墨西哥|墨西哥城|mexico city/i, code: 'MX' },
  { re: /\bnz\b|new zealand|新西兰|奥克兰|auckland/i, code: 'NZ' },
  { re: /\bil\b|israel|以色列|特拉维夫|tel aviv/i, code: 'IL' },
  { re: /\bae\b|\buae\b|阿联酋|迪拜|dubai|阿布扎比|abu dhabi/i, code: 'AE' },
  { re: /\bis\b|iceland|冰岛|雷克雅未克|reykjavik/i, code: 'IS' },
  { re: /\blt\b|lithuania|立陶宛|维尔纽斯|vilnius/i, code: 'LT' },
  { re: /\blv\b|latvia|拉脱维亚|里加|riga/i, code: 'LV' },
  { re: /\bee\b|estonia|爱沙尼亚|塔林|tallinn/i, code: 'EE' },
  { re: /\bsi\b|slovenia|斯洛文尼亚|卢布尔雅那|ljubljana/i, code: 'SI' },
  { re: /\bsk\b|slovakia|斯洛伐克|布拉迪斯拉发|bratislava/i, code: 'SK' },
  { re: /\bgr\b|greece|希腊|雅典|athens/i, code: 'GR' },
  { re: /\bge\b|georgia|格鲁吉亚|第比利斯|tbilisi/i, code: 'GE' },
  { re: /\bar\b|argentina|阿根廷|布宜诺斯艾利斯|buenos aires/i, code: 'AR' },
  { re: /\bcl\b|chile|智利|圣地亚哥|santiago/i, code: 'CL' },
  { re: /\bkz\b|kazakhstan|哈萨克斯坦|阿拉木图|almaty/i, code: 'KZ' },
  { re: /\bmd\b|moldova|摩尔多瓦|基希讷乌|chisinau/i, code: 'MD' },
  { re: /\brs\b|serbia|塞尔维亚|贝尔格莱德|belgrade/i, code: 'RS' }
]

const EMOJI_CACHE = {}

function emojiOf(code) {
  if (!code) return null
  const c = code.toUpperCase()
  if (!/^[A-Z]{2}$/.test(c)) return null
  if (!EMOJI_CACHE[c]) {
    EMOJI_CACHE[c] = String.fromCodePoint(...[...c].map(ch => 0x1f1a5 + ch.charCodeAt(0)))
  }
  return EMOJI_CACHE[c]
}

// 返回地区对应的两位 ISO 代码，无法识别时返回 null
export function getRegionCode(region) {
  const value = (region || '').trim()
  if (!value) return null
  if (/^[A-Za-z]{2}$/.test(value)) return value.toUpperCase()
  for (const rule of REGION_RULES) {
    if (rule.re.test(value)) return rule.code
  }
  return null
}

// 返回国旗 emoji，无法识别时返回 null
export function getFlagEmoji(region) {
  return emojiOf(getRegionCode(region))
}
