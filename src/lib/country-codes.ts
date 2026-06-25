type CountryInfo = {
  code: string;
  ptName: string;
};

const countries: Record<string, CountryInfo> = {
  Algeria: { code: "dz", ptName: "Argélia" },
  Argentina: { code: "ar", ptName: "Argentina" },
  Australia: { code: "au", ptName: "Austrália" },
  Austria: { code: "at", ptName: "Áustria" },
  Belgium: { code: "be", ptName: "Bélgica" },
  "Bosnia-H.": { code: "ba", ptName: "Bósnia" },
  "Bosnia-Herzegovina": { code: "ba", ptName: "Bósnia" },
  Brazil: { code: "br", ptName: "Brasil" },
  Canada: { code: "ca", ptName: "Canadá" },
  "Cape Verde": { code: "cv", ptName: "Cabo Verde" },
  Colombia: { code: "co", ptName: "Colômbia" },
  "Congo DR": { code: "cd", ptName: "RD Congo" },
  "DR Congo": { code: "cd", ptName: "RD Congo" },
  Croatia: { code: "hr", ptName: "Croácia" },
  "Curaçao": { code: "cw", ptName: "Curaçao" },
  Czechia: { code: "cz", ptName: "Tchéquia" },
  Ecuador: { code: "ec", ptName: "Equador" },
  Egypt: { code: "eg", ptName: "Egito" },
  England: { code: "gb-eng", ptName: "Inglaterra" },
  France: { code: "fr", ptName: "França" },
  Germany: { code: "de", ptName: "Alemanha" },
  Ghana: { code: "gh", ptName: "Gana" },
  Haiti: { code: "ht", ptName: "Haiti" },
  Iran: { code: "ir", ptName: "Irã" },
  Iraq: { code: "iq", ptName: "Iraque" },
  "Ivory Coast": { code: "ci", ptName: "Costa do Marfim" },
  Japan: { code: "jp", ptName: "Japão" },
  Jordan: { code: "jo", ptName: "Jordânia" },
  "Korea Republic": { code: "kr", ptName: "Coreia do Sul" },
  "South Korea": { code: "kr", ptName: "Coreia do Sul" },
  Mexico: { code: "mx", ptName: "México" },
  Morocco: { code: "ma", ptName: "Marrocos" },
  Netherlands: { code: "nl", ptName: "Holanda" },
  "New Zealand": { code: "nz", ptName: "Nova Zelândia" },
  Norway: { code: "no", ptName: "Noruega" },
  Panama: { code: "pa", ptName: "Panamá" },
  Paraguay: { code: "py", ptName: "Paraguai" },
  Portugal: { code: "pt", ptName: "Portugal" },
  Qatar: { code: "qa", ptName: "Catar" },
  "Saudi Arabia": { code: "sa", ptName: "Arábia Saudita" },
  Scotland: { code: "gb-sct", ptName: "Escócia" },
  Senegal: { code: "sn", ptName: "Senegal" },
  "South Africa": { code: "za", ptName: "África do Sul" },
  Spain: { code: "es", ptName: "Espanha" },
  Sweden: { code: "se", ptName: "Suécia" },
  Switzerland: { code: "ch", ptName: "Suíça" },
  Tunisia: { code: "tn", ptName: "Tunísia" },
  Turkey: { code: "tr", ptName: "Turquia" },
  "Trinidad and Tobago": { code: "tt", ptName: "Trinidad e Tobago" },
  USA: { code: "us", ptName: "EUA" },
  "United States": { code: "us", ptName: "EUA" },
  Uruguay: { code: "uy", ptName: "Uruguai" },
  Uzbekistan: { code: "uz", ptName: "Uzbequistão" },
  "Dominican Republic": { code: "do", ptName: "Rep. Dominicana" },
  Suriname: { code: "sr", ptName: "Suriname" },
  "Costa Rica": { code: "cr", ptName: "Costa Rica" },

  // PT-BR names mapping to themselves
  Brasil: { code: "br", ptName: "Brasil" },
  França: { code: "fr", ptName: "França" },
  Inglaterra: { code: "gb-eng", ptName: "Inglaterra" },
  Espanha: { code: "es", ptName: "Espanha" },
  Alemanha: { code: "de", ptName: "Alemanha" },
  Holanda: { code: "nl", ptName: "Holanda" },
  Itália: { code: "it", ptName: "Itália" },
  Bélgica: { code: "be", ptName: "Bélgica" },
  Colômbia: { code: "co", ptName: "Colômbia" },
  Uruguai: { code: "uy", ptName: "Uruguai" },
  México: { code: "mx", ptName: "México" },
  Japão: { code: "jp", ptName: "Japão" },
  Croácia: { code: "hr", ptName: "Croácia" },
  EUA: { code: "us", ptName: "EUA" },
  Austrália: { code: "au", ptName: "Austrália" },
  Canadá: { code: "ca", ptName: "Canadá" },
  Gana: { code: "gh", ptName: "Gana" },
  Iraque: { code: "iq", ptName: "Iraque" },
  Panamá: { code: "pa", ptName: "Panamá" },
  "Arábia Saudita": { code: "sa", ptName: "Arábia Saudita" },
  "Coreia do Sul": { code: "kr", ptName: "Coreia do Sul" },
  Escócia: { code: "gb-sct", ptName: "Escócia" },
};

export function getCountryCode(name: string): string {
  return countries[name]?.code || "un";
}

export function getCountryName(name: string): string {
  return countries[name]?.ptName || name;
}

export function getFlagUrl(name: string, size: number = 40): string {
  const code = getCountryCode(name);
  if (code === "un") return "";
  return `https://flagcdn.com/w${size}/${code}.png`;
}

export function matchesCountryName(teamName: string, favoriteName: string): boolean {
  if (teamName === favoriteName) return true;
  const teamPt = countries[teamName]?.ptName;
  const favPt = countries[favoriteName]?.ptName;
  if (teamPt && favPt && teamPt === favPt) return true;
  return false;
}
