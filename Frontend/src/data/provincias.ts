export interface Provincia {
  codigo: string;
  nombre: string;
  parroquias: string[];
}

export const PROVINCIAS_ECUADOR: Provincia[] = [
  {
    codigo: '01',
    nombre: 'Azuay',
    parroquias: ['Cuenca - El Sagrario', 'Cuenca - San Blas', 'Cuenca - Baños', 'Cuenca - Yanuncay', 'Gualaceo - Centro', 'Paute - Centro', 'Sígsig']
  },
  {
    codigo: '02',
    nombre: 'Bolívar',
    parroquias: ['Guaranda - Angel Polibio Cháves', 'Guaranda - Guanujo', 'San Miguel', 'Chimbo', 'Echeandía', 'Caluma']
  },
  {
    codigo: '03',
    nombre: 'Cañar',
    parroquias: ['Azogues - Aurelio Bayas', 'Azogues - San Francisco', 'La Troncal', 'Cañar', 'Biblián', 'El Tambo']
  },
  {
    codigo: '04',
    nombre: 'Carchi',
    parroquias: ['Tulcán - González Suárez', 'Tulcán - El Sagrario', 'San Gabriel', 'Montúfar', 'El Ángel', 'Huaca']
  },
  {
    codigo: '05',
    nombre: 'Cotopaxi',
    parroquias: ['Latacunga - La Matriz', 'Latacunga - San Buenaventura', 'Latacunga - El Salto', 'Pujilí', 'Salcedo', 'Saquisilí', 'La Maná']
  },
  {
    codigo: '06',
    nombre: 'Chimborazo',
    parroquias: ['Riobamba - Lizarzaburu', 'Riobamba - Maldonado', 'Riobamba - Velasco', 'Riobamba - Yaruquíes', 'Alausí', 'Guano', 'Chambo']
  },
  {
    codigo: '07',
    nombre: 'El Oro',
    parroquias: ['Machala - Machala', 'Machala - Puerto Bolívar', 'Machala - El Cambio', 'Pasaje', 'Santa Rosa', 'Huaquillas', 'Arenillas']
  },
  {
    codigo: '08',
    nombre: 'Esmeraldas',
    parroquias: ['Esmeraldas - 5 de Agosto', 'Esmeraldas - Bartolomé Ruiz', 'Esmeraldas - Luis Tello', 'Atacames', 'Quinindé', 'Muisne', 'San Lorenzo']
  },
  {
    codigo: '09',
    nombre: 'Guayas',
    parroquias: ['Guayaquil - Tarqui', 'Guayaquil - Ximena', 'Guayaquil - Febres Cordero', 'Guayaquil - Carbo', 'Guayaquil - Urdaneta', 'Samborondón', 'Durán', 'Daule', 'Milagro']
  },
  {
    codigo: '10',
    nombre: 'Imbabura',
    parroquias: ['Ibarra - San Francisco', 'Ibarra - El Sagrario', 'Ibarra - Alpachaca', 'Ibarra - Caranqui', 'Otavalo', 'Cotacachi', 'Atuntaqui']
  },
  {
    codigo: '11',
    nombre: 'Loja',
    parroquias: ['Loja - El Sagrario', 'Loja - Sucre', 'Loja - El Valle', 'Loja - San Sebastián', 'Catamayo', 'Calvas', 'Macará', 'Saraguro']
  },
  {
    codigo: '12',
    nombre: 'Los Ríos',
    parroquias: ['Babahoyo - Clemente Baquerizo', 'Babahoyo - El Salto', 'Quevedo - 7 de Octubre', 'Quevedo - San Camilo', 'Vinces', 'Ventanillas', 'Mocache']
  },
  {
    codigo: '13',
    nombre: 'Manabí',
    parroquias: ['Portoviejo - Andrés de Vera', 'Portoviejo - 12 de Marzo', 'Portoviejo - San Pablo', 'Manta - Tarqui', 'Manta - Los Esteros', 'Manta - Eloy Alfaro', 'Chone', 'Jipijapa', 'Montecristi']
  },
  {
    codigo: '14',
    nombre: 'Morona Santiago',
    parroquias: ['Macas - Macas', 'Macas - General Proaño', 'Sucúa', 'Gualaquiza', 'Limón Indanza', 'Palora']
  },
  {
    codigo: '15',
    nombre: 'Napo',
    parroquias: ['Tena - Tena', 'Tena - Muyuna', 'Archidona', 'El Chaco', 'Baeza', 'Carlos Julio Arosemena Tola']
  },
  {
    codigo: '16',
    nombre: 'Pastaza',
    parroquias: ['Puyo - Puyo', 'Puyo - Veracruz', 'Mera', 'Santa Clara', 'Arajuno']
  },
  {
    codigo: '17',
    nombre: 'Pichincha',
    parroquias: ['Quito - Iñaquito', 'Quito - Belisario Quevedo', 'Quito - Carcelén', 'Quito - Cotocollao', 'Quito - Conocoto', 'Quito - Cumbayá', 'Quito - Tumbaco', 'Quito - Quitumbe', 'Quito - Chimbacalle', 'Sangolquí', 'Machachi']
  },
  {
    codigo: '18',
    nombre: 'Tungurahua',
    parroquias: ['Ambato - La Matriz', 'Ambato - Atocha-Ficoa', 'Ambato - Izamba', 'Ambato - Huachi Loreto', 'Baños de Agua Santa', 'Pelileo', 'Píllaro']
  },
  {
    codigo: '19',
    nombre: 'Zamora Chinchipe',
    parroquias: ['Zamora - Zamora', 'Zamora - Cumbaratza', 'Yantzaza', 'Yacuambi', 'El Pangui', 'Zumba']
  },
  {
    codigo: '20',
    nombre: 'Galápagos',
    parroquias: ['San Cristóbal - Puerto Baquerizo Moreno', 'Santa Cruz - Puerto Ayora', 'Isabela - Puerto Villamil']
  },
  {
    codigo: '21',
    nombre: 'Sucumbíos',
    parroquias: ['Nueva Loja - Nueva Loja', 'Shushufindi', 'Cáscales', 'Cuyabeno', 'Gonzalo Pizarro']
  },
  {
    codigo: '22',
    nombre: 'Orellana',
    parroquias: ['Puerto Francisco de Orellana - El Coca', 'Loreto', 'La Joya de los Sachas', 'Nuevo Rocafuerte']
  },
  {
    codigo: '23',
    nombre: 'Santo Domingo de los Tsáchilas',
    parroquias: ['Santo Domingo - Chiguilpe', 'Santo Domingo - Abraham Calazacón', 'Santo Domingo - Bombolí', 'Santo Domingo - Río Verde', 'Santo Domingo - Zaracay', 'Alluriquín']
  },
  {
    codigo: '24',
    nombre: 'Santa Elena',
    parroquias: ['Santa Elena - Ballenita', 'Salinas - Centro', 'La Libertad', 'Manglaralto', 'Chanduy']
  },
  {
    codigo: '30',
    nombre: 'Ecuatorianos registrados en el Exterior',
    parroquias: ['Consulado en Madrid', 'Consulado en New York', 'Consulado en Milán', 'Consulado en Roma', 'Consulado en Barcelona', 'Consulado en Miami', 'Consulado en Londres']
  }
];
