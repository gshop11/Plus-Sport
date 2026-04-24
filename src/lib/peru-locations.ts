export const normalizeLocationValue = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const PERU_CITY_DISTRICTS: Record<string, string[]> = {
  Lima: [
    'Ancon',
    'Ate',
    'Barranco',
    'Brena',
    'Carabayllo',
    'Chaclacayo',
    'Chorrillos',
    'Cieneguilla',
    'Comas',
    'El Agustino',
    'Independencia',
    'Jesus Maria',
    'La Molina',
    'La Victoria',
    'Lima',
    'Lince',
    'Los Olivos',
    'Lurigancho',
    'Lurin',
    'Magdalena del Mar',
    'Miraflores',
    'Pachacamac',
    'Pucusana',
    'Pueblo Libre',
    'Puente Piedra',
    'Punta Hermosa',
    'Punta Negra',
    'Rimac',
    'San Bartolo',
    'San Borja',
    'San Isidro',
    'San Juan de Lurigancho',
    'San Juan de Miraflores',
    'San Luis',
    'San Martin de Porres',
    'San Miguel',
    'Santa Anita',
    'Santa Maria del Mar',
    'Santa Rosa',
    'Santiago de Surco',
    'Surquillo',
    'Villa El Salvador',
    'Villa Maria del Triunfo',
  ],
  Arequipa: [
    'Alto Selva Alegre',
    'Cayma',
    'Cerro Colorado',
    'Jose Luis Bustamante y Rivero',
    'Miraflores',
    'Paucarpata',
    'Socabaya',
    'Yanahuara',
  ],
  Trujillo: [
    'Trujillo',
    'El Porvenir',
    'Florencia de Mora',
    'Huanchaco',
    'La Esperanza',
    'Laredo',
    'Moche',
    'Salaverry',
    'Victor Larco Herrera',
  ],
  Cusco: ['Cusco', 'San Jeronimo', 'San Sebastian', 'Santiago', 'Wanchaq'],
  Piura: ['Piura', 'Castilla', 'Catacaos', 'Veintiseis de Octubre'],
  Chiclayo: ['Chiclayo', 'Jose Leonardo Ortiz', 'La Victoria', 'Pimentel'],
}

const CITY_BY_NORMALIZED_NAME = new Map(
  Object.keys(PERU_CITY_DISTRICTS).map((city) => [normalizeLocationValue(city), city]),
)

const DISTRICT_SET_BY_CITY = new Map(
  Object.entries(PERU_CITY_DISTRICTS).map(([city, districts]) => [
    city,
    new Set(districts.map((district) => normalizeLocationValue(district))),
  ]),
)

export const PERU_CITY_OPTIONS = Object.keys(PERU_CITY_DISTRICTS)

export const getDistrictsByCity = (city: string) => {
  const canonicalCity = CITY_BY_NORMALIZED_NAME.get(normalizeLocationValue(city))
  if (!canonicalCity) return []
  return PERU_CITY_DISTRICTS[canonicalCity] ?? []
}

export const isDistrictValidForCity = (city: string, district: string) => {
  const canonicalCity = CITY_BY_NORMALIZED_NAME.get(normalizeLocationValue(city))
  if (!canonicalCity) return true
  const districtSet = DISTRICT_SET_BY_CITY.get(canonicalCity)
  if (!districtSet) return true
  return districtSet.has(normalizeLocationValue(district))
}

