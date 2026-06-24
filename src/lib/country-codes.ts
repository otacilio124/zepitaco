const countryToCode: Record<string, string> = {
  Brasil: "br", Brazil: "br",
  Argentina: "ar",
  França: "fr", France: "fr",
  Inglaterra: "gb-eng", England: "gb-eng",
  Espanha: "es", Spain: "es",
  Alemanha: "de", Germany: "de",
  Portugal: "pt",
  Holanda: "nl", Netherlands: "nl",
  Itália: "it", Italy: "it",
  Bélgica: "be", Belgium: "be",
  Colômbia: "co", Colombia: "co",
  Uruguai: "uy", Uruguay: "uy",
  EUA: "us", USA: "us", "United States": "us",
  México: "mx", Mexico: "mx",
  Japão: "jp", Japan: "jp",
  Croácia: "hr", Croatia: "hr",
  "Coreia do Sul": "kr", "South Korea": "kr",
  Austrália: "au", Australia: "au",
  Canadá: "ca", Canada: "ca",
  "Arábia Saudita": "sa", "Saudi Arabia": "sa",
  Gana: "gh", Ghana: "gh",
  "Costa Rica": "cr",
  Panamá: "pa", Panama: "pa",
  Iraque: "iq", Iraq: "iq",
  Scotland: "gb-sct", Escócia: "gb-sct",
  Morocco: "ma", Marrocos: "ma",
  Serbia: "rs", Sérvia: "rs",
  Ecuador: "ec", Equador: "ec",
  "Trinidad and Tobago": "tt",
  Haiti: "ht",
  "Dominican Republic": "do",
  Suriname: "sr",
  "DR Congo": "cd",
};

const ptToEn: Record<string, string[]> = {
  Brasil: ["Brazil"],
  Argentina: ["Argentina"],
  França: ["France"],
  Inglaterra: ["England"],
  Espanha: ["Spain"],
  Alemanha: ["Germany"],
  Portugal: ["Portugal"],
  Holanda: ["Netherlands"],
  Itália: ["Italy"],
  Bélgica: ["Belgium"],
  Colômbia: ["Colombia"],
  Uruguai: ["Uruguay"],
  EUA: ["USA", "United States"],
  México: ["Mexico"],
  Japão: ["Japan"],
  Croácia: ["Croatia"],
  "Coreia do Sul": ["South Korea"],
  Austrália: ["Australia"],
  Canadá: ["Canada"],
  "Arábia Saudita": ["Saudi Arabia"],
  Gana: ["Ghana"],
  "Costa Rica": ["Costa Rica"],
  Panamá: ["Panama"],
  Iraque: ["Iraq"],
};

export function getCountryCode(name: string): string {
  return countryToCode[name] || "un";
}

export function getFlagUrl(name: string, size: number = 40): string {
  const code = getCountryCode(name);
  return `https://flagcdn.com/w${size}/${code}.png`;
}

export function matchesCountryName(teamName: string, favoriteName: string): boolean {
  if (teamName === favoriteName) return true;
  const variants = ptToEn[favoriteName];
  if (variants && variants.includes(teamName)) return true;
  const reverseVariants = Object.entries(ptToEn).find(([, en]) => en.includes(favoriteName));
  if (reverseVariants && reverseVariants[0] === teamName) return true;
  return false;
}
