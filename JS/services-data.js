// =====================================================
// DALE DEAL - Services Data
// =====================================================

const servicesData = [
  {
    id: 'installation-tech',
    title: 'Instalación Técnica Profesional',
    description: 'Instalación y configuración profesional de todos tus dispositivos por técnicos certificados.',
    category: 'installation',
    price: 15999,
    rating: 4.9,
    reviewCount: 127,
    location: 'Córdoba Capital',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
    badges: [
      { text: 'Certificado', color: '#3b82f6' },
      { text: 'Garantía 1 año', color: '#22c55e' }
    ],
    provider: { name: 'Alejandro R.', avatar: 'https://i.pravatar.cc/40?img=12', verified: true },
    featured: true
  },
  {
    id: 'tech-support',
    title: 'Soporte Técnico Especializado',
    description: 'Asistencia técnica 24/7 para resolver cualquier problema con tus dispositivos.',
    category: 'consultation',
    price: 8999,
    priceType: 'monthly',
    rating: 4.6,
    reviewCount: 89,
    location: 'Todo el país',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
    badges: [
      { text: '24/7', color: '#8b5cf6' },
      { text: 'Remoto', color: '#14b8a6' }
    ],
    provider: { name: 'Martín G.', avatar: 'https://i.pravatar.cc/40?img=33', verified: true },
    featured: true
  },
  {
    id: 'pastry-service',
    title: 'Repostería & Pastelería Profesional',
    description: 'Creamos tortas, postres y dulces personalizados para todo tipo de eventos especiales.',
    category: 'catering',
    price: 35999,
    rating: 4.9,
    reviewCount: 234,
    location: 'Buenos Aires',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
    badges: [
      { text: 'Artesanal', color: '#ec4899' },
      { text: 'Personalizado', color: '#f97316' }
    ],
    provider: { name: 'Laura M.', avatar: 'https://i.pravatar.cc/40?img=5', verified: true },
    featured: true
  },
  {
    id: 'home-chef',
    title: 'Chef Profesional a Domicilio',
    description: 'Chef profesional cocina en tu hogar para cenas íntimas, eventos familiares o celebraciones.',
    category: 'catering',
    price: 75999,
    rating: 5.0,
    reviewCount: 156,
    location: 'Capital Federal',
    image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=300&fit=crop',
    badges: [
      { text: 'Premium', color: '#f59e0b' },
      { text: 'Chef certificado', color: '#ef4444' }
    ],
    provider: { name: 'Federico T.', avatar: 'https://i.pravatar.cc/40?img=68', verified: true },
    topRated: true,
    featured: true
  },
  {
    id: 'construction-service',
    title: 'Albañilería & Construcción',
    description: 'Servicios de albañilería, reformas, ampliaciones con materiales de calidad y acabados profesionales.',
    category: 'construction',
    price: 45999,
    priceType: 'per_m2',
    rating: 4.7,
    reviewCount: 203,
    location: 'Zona Sur GBA',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    badges: [
      { text: 'Profesional', color: '#6366f1' },
      { text: 'Garantía obra', color: '#22c55e' }
    ],
    provider: { name: 'Pablo S.', avatar: 'https://i.pravatar.cc/40?img=52', verified: true },
    featured: true
  },
  {
    id: 'plumbing-service',
    title: 'Plomería & Gasfitería',
    description: 'Instalación, reparación y mantenimiento de sistemas de agua, gas y desagües con técnicos matriculados.',
    category: 'repair',
    price: 18999,
    rating: 4.9,
    reviewCount: 312,
    location: 'CABA y GBA',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=300&fit=crop',
    badges: [
      { text: 'Emergencias 24h', color: '#ef4444' },
      { text: 'Matriculado', color: '#3b82f6' }
    ],
    provider: { name: 'Roberto V.', avatar: 'https://i.pravatar.cc/40?img=60', verified: true },
    emergency: true,
    featured: true
  },
  {
    id: 'electrician-service',
    title: 'Electricista Matriculado',
    description: 'Instalaciones eléctricas, reparaciones, tableros, iluminación y solución de problemas eléctricos.',
    category: 'installation',
    price: 15999,
    rating: 4.8,
    reviewCount: 267,
    location: 'CABA',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
    badges: [
      { text: 'Matriculado', color: '#f59e0b' },
      { text: 'Garantía', color: '#22c55e' }
    ],
    provider: { name: 'Alejandro R.', avatar: 'https://i.pravatar.cc/40?img=12', verified: true },
    featured: true
  },
  {
    id: 'gardening-service',
    title: 'Jardinería & Paisajismo',
    description: 'Diseño de jardines, mantenimiento, poda, fumigación y servicios de paisajismo profesional.',
    category: 'maintenance',
    price: 12999,
    rating: 4.9,
    reviewCount: 189,
    location: 'Zona Norte GBA',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    badges: [
      { text: 'Eco-friendly', color: '#22c55e' },
      { text: 'Sin químicos', color: '#14b8a6' }
    ],
    provider: { name: 'Sofía P.', avatar: 'https://i.pravatar.cc/40?img=25', verified: true },
    featured: true
  },
  {
    id: 'cleaning-service',
    title: 'Limpieza Profesional',
    description: 'Servicio de limpieza profunda para hogares y oficinas con productos ecológicos y personal capacitado.',
    category: 'maintenance',
    price: 9999,
    rating: 4.7,
    reviewCount: 445,
    location: 'CABA y GBA',
    image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=400&h=300&fit=crop',
    badges: [
      { text: 'Verificado', color: '#3b82f6' },
      { text: 'Eco', color: '#10b981' }
    ],
    provider: { name: 'Valeria C.', avatar: 'https://i.pravatar.cc/40?img=9', verified: true },
    featured: true
  },
  {
    id: 'painting-service',
    title: 'Pintura de Interiores y Exteriores',
    description: 'Pintura profesional de casas, departamentos y oficinas con materiales de primera calidad.',
    category: 'maintenance',
    price: 25999,
    priceType: 'per_room',
    rating: 4.9,
    reviewCount: 321,
    location: 'CABA y GBA',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop',
    badges: [
      { text: 'Profesional', color: '#8b5cf6' },
      { text: 'Pintura premium', color: '#f97316' }
    ],
    provider: { name: 'Diego F.', avatar: 'https://i.pravatar.cc/40?img=47', verified: true },
    featured: true
  },
  {
    id: 'carpentry-service',
    title: 'Carpintería & Muebles a Medida',
    description: 'Diseño y fabricación de muebles a medida, puertas, ventanas, placares y trabajos en madera.',
    category: 'construction',
    price: 22999,
    rating: 4.8,
    reviewCount: 178,
    location: 'Zona Oeste GBA',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop',
    badges: [
      { text: 'A medida', color: '#f59e0b' },
      { text: 'Diseño incluido', color: '#6366f1' }
    ],
    provider: { name: 'Nicolás B.', avatar: 'https://i.pravatar.cc/40?img=57', verified: true },
    featured: true
  },
  {
    id: 'moving-service',
    title: 'Mudanzas & Fletes',
    description: 'Servicio de mudanzas locales y a larga distancia con personal capacitado y vehículos equipados.',
    category: 'consultation',
    price: 45999,
    rating: 4.9,
    reviewCount: 523,
    location: 'Todo el país',
    image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop',
    badges: [
      { text: 'Asegurado', color: '#3b82f6' },
      { text: 'Larga distancia', color: '#14b8a6' }
    ],
    provider: { name: 'Gustavo H.', avatar: 'https://i.pravatar.cc/40?img=70', verified: true },
    nationwide: true,
    featured: true
  },
  {
    id: 'ac-service',
    title: 'Instalación de Aire Acondicionado',
    description: 'Instalación, mantenimiento y reparación de equipos de aire acondicionado split, central y portátil.',
    category: 'installation',
    price: 18999,
    rating: 4.7,
    reviewCount: 298,
    location: 'CABA y GBA',
    image: 'https://images.unsplash.com/photo-1631545804657-2c2f0b4122bf?w=400&h=300&fit=crop',
    badges: [
      { text: 'Certificado', color: '#06b6d4' },
      { text: 'Garantía 2 años', color: '#22c55e' }
    ],
    provider: { name: 'Alejandro R.', avatar: 'https://i.pravatar.cc/40?img=12', verified: true },
    featured: true
  }
];

// ── Helpers de acceso ─────────────────────────────────────────────────────────

/**
 * Obtener un servicio por su ID de cadena.
 * @param {string} id
 * @returns {object|null}
 */
function getServiceById(id) {
  return servicesData.find(s => s.id === id) || null;
}

/**
 * Obtener todos los servicios.
 * @returns {object[]}
 */
function getAllServices() {
  return servicesData;
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { servicesData, getServiceById, getAllServices };
}
