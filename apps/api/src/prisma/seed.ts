import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ==================== SETTINGS ====================
  console.log('📝 Creating settings...')
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      storeName: 'Katsuda',
      phone: '261 429-2473',
      whatsapp: '5492614292473',
      email: 'info@katsuda.com.ar',
      address: {
        mendoza: {
          street: 'San Martín',
          number: '1234',
          city: 'Ciudad de Mendoza',
          province: 'Mendoza',
          postalCode: '5500',
          phone: '261 429-2473'
        },
        sanJuan: {
          street: 'Av. Libertador',
          number: '567',
          city: 'San Juan',
          province: 'San Juan',
          postalCode: '5400',
          phone: '264 422-5678'
        }
      },
      socialMedia: {
        instagram: 'https://instagram.com/katsuda.srl',
        facebook: 'https://facebook.com/katsuda.srl'
      },
      transferDiscount: 9,
      schedules: {
        weekdays: 'Lunes a Viernes: 8:30 a 13:00 y 17:00 a 20:30',
        saturday: 'Sábados: 9:00 a 13:00',
        sunday: 'Domingos: Cerrado'
      }
    }
  })

  // ==================== ADMIN ====================
  console.log('👤 Creating admin user...')
  const hashedPassword = await bcrypt.hash('katsuda2024', 10)
  await prisma.admin.upsert({
    where: { email: 'admin@katsuda.com.ar' },
    update: {},
    create: {
      email: 'admin@katsuda.com.ar',
      password: hashedPassword,
      name: 'Administrador',
      role: 'SUPER',
      isActive: true
    }
  })

  // ==================== CATEGORIES ====================
  console.log('📁 Creating categories...')
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'griferias' },
      update: {},
      create: {
        name: 'Griferías',
        slug: 'griferias',
        description: 'Griferías de cocina y baño de las mejores marcas',
        image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
        order: 1
      }
    }),
    prisma.category.upsert({
      where: { slug: 'sanitarios' },
      update: {},
      create: {
        name: 'Sanitarios',
        slug: 'sanitarios',
        description: 'Inodoros, bidets, lavatorios y accesorios',
        image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400',
        order: 2
      }
    }),
    prisma.category.upsert({
      where: { slug: 'termotanques' },
      update: {},
      create: {
        name: 'Termotanques',
        slug: 'termotanques',
        description: 'Termotanques eléctricos y a gas',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400',
        order: 3
      }
    }),
    prisma.category.upsert({
      where: { slug: 'bombas' },
      update: {},
      create: {
        name: 'Bombas',
        slug: 'bombas',
        description: 'Bombas de agua presurizadoras y de elevación',
        image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400',
        order: 4
      }
    }),
    prisma.category.upsert({
      where: { slug: 'hogar' },
      update: {},
      create: {
        name: 'Hogar',
        slug: 'hogar',
        description: 'Artículos para el hogar y electrodomésticos',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
        order: 5
      }
    }),
    prisma.category.upsert({
      where: { slug: 'instalaciones' },
      update: {},
      create: {
        name: 'Instalaciones',
        slug: 'instalaciones',
        description: 'Materiales y accesorios para instalaciones',
        image: 'https://images.unsplash.com/photo-1581092921461-39b9d4d6f4c8?w=400',
        order: 6
      }
    })
  ])

  // Subcategorías de Griferías
  const [griferias] = categories
  await Promise.all([
    prisma.category.upsert({
      where: { slug: 'griferias-cocina' },
      update: {},
      create: {
        name: 'Cocina',
        slug: 'griferias-cocina',
        description: 'Griferías para cocina',
        parentId: griferias.id,
        order: 1
      }
    }),
    prisma.category.upsert({
      where: { slug: 'griferias-bano' },
      update: {},
      create: {
        name: 'Baño',
        slug: 'griferias-bano',
        description: 'Griferías para baño',
        parentId: griferias.id,
        order: 2
      }
    }),
    prisma.category.upsert({
      where: { slug: 'griferias-ducha' },
      update: {},
      create: {
        name: 'Ducha',
        slug: 'griferias-ducha',
        description: 'Griferías para ducha',
        parentId: griferias.id,
        order: 3
      }
    })
  ])

  // ==================== BRANDS ====================
  console.log('🏷️ Creating brands...')
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'fv' },
      update: {},
      create: {
        name: 'FV',
        slug: 'fv',
        logo: 'https://www.fv.com.ar/themes/fv/images/logo.svg'
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'piazza' },
      update: {},
      create: {
        name: 'Piazza',
        slug: 'piazza',
        logo: 'https://piazza.com.ar/img/logo.png'
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'ferrum' },
      update: {},
      create: {
        name: 'Ferrum',
        slug: 'ferrum',
        logo: 'https://www.ferrum.com/themes/ferrum/images/logo.svg'
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'roca' },
      update: {},
      create: {
        name: 'Roca',
        slug: 'roca',
        logo: 'https://www.roca.com.ar/sites/all/themes/roca/logo.svg'
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'aqua' },
      update: {},
      create: {
        name: 'Aqua',
        slug: 'aqua',
        logo: null
      }
    }),
    prisma.brand.upsert({
      where: { slug: 'deca' },
      update: {},
      create: {
        name: 'DECA',
        slug: 'deca',
        logo: null
      }
    })
  ])

  const [fv, piazza, ferrum, roca, aqua, deca] = brands
  const [catGriferias, catSanitarios, catTermotanques, catBombas, catHogar, catInstalaciones] = categories

  // ==================== PRODUCTS ====================
  console.log('📦 Creating products...')

  const products = [
    // Griferías FV
    {
      sku: 'FV-0181-27',
      name: 'Grifería Monocomando Cocina FV Libby',
      slug: 'griferia-monocomando-cocina-fv-libby',
      description: 'Grifería monocomando para cocina línea Libby de FV. Diseño moderno y funcional con pico alto giratorio. Ideal para piletas profundas.',
      shortDesc: 'Monocomando cocina con pico alto giratorio',
      price: 185000,
      comparePrice: 210000,
      transferPrice: 168350,
      stock: 15,
      categoryId: catGriferias.id,
      brandId: fv.id,
      isFeatured: true,
      freeShipping: false,
      weight: 1.2,
      tags: ['monocomando', 'cocina', 'pico alto'],
      images: [
        { url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800', alt: 'Grifería FV Libby', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Tipo', value: 'Monocomando' },
        { name: 'Material', value: 'Bronce cromado' },
        { name: 'Garantía', value: '5 años' }
      ]
    },
    {
      sku: 'FV-0294-17',
      name: 'Grifería Bicomando Baño FV Arizona',
      slug: 'griferia-bicomando-bano-fv-arizona',
      description: 'Grifería bicomando para baño línea Arizona. Estilo clásico con terminación cromada de alta durabilidad.',
      shortDesc: 'Bicomando baño clásico',
      price: 125000,
      comparePrice: null,
      transferPrice: 113750,
      stock: 22,
      categoryId: catGriferias.id,
      brandId: fv.id,
      isFeatured: false,
      freeShipping: false,
      weight: 0.9,
      tags: ['bicomando', 'baño', 'clásico'],
      images: [
        { url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', alt: 'Grifería FV Arizona', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Tipo', value: 'Bicomando' },
        { name: 'Material', value: 'Bronce cromado' },
        { name: 'Garantía', value: '5 años' }
      ]
    },
    // Sanitarios Ferrum
    {
      sku: 'FER-ANDINA-I',
      name: 'Inodoro Largo Ferrum Andina',
      slug: 'inodoro-largo-ferrum-andina',
      description: 'Inodoro largo deposito de apoyo línea Andina de Ferrum. Diseño moderno, descarga dual para ahorro de agua.',
      shortDesc: 'Inodoro largo con depósito de apoyo',
      price: 320000,
      comparePrice: 380000,
      transferPrice: 291200,
      stock: 8,
      categoryId: catSanitarios.id,
      brandId: ferrum.id,
      isFeatured: true,
      freeShipping: true,
      weight: 25,
      tags: ['inodoro', 'deposito', 'ahorro agua'],
      images: [
        { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', alt: 'Inodoro Ferrum Andina', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Tipo', value: 'Largo' },
        { name: 'Depósito', value: 'De apoyo' },
        { name: 'Descarga', value: 'Dual (3/6 litros)' }
      ]
    },
    {
      sku: 'FER-BALI-L',
      name: 'Lavatorio Ferrum Bali',
      slug: 'lavatorio-ferrum-bali',
      description: 'Lavatorio de colgar línea Bali. Elegante diseño con 1 agujero para grifería monocomando.',
      shortDesc: 'Lavatorio de colgar elegante',
      price: 145000,
      comparePrice: null,
      transferPrice: 131950,
      stock: 12,
      categoryId: catSanitarios.id,
      brandId: ferrum.id,
      isFeatured: false,
      freeShipping: false,
      weight: 12,
      tags: ['lavatorio', 'colgar', '1 agujero'],
      images: [
        { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', alt: 'Lavatorio Ferrum Bali', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Instalación', value: 'De colgar' },
        { name: 'Agujeros', value: '1' }
      ]
    },
    // Termotanques
    {
      sku: 'TT-RHEEM-80E',
      name: 'Termotanque Eléctrico Rheem 80 Litros',
      slug: 'termotanque-electrico-rheem-80-litros',
      description: 'Termotanque eléctrico de 80 litros. Alta eficiencia energética, ideal para familia de 3-4 personas.',
      shortDesc: 'Termotanque eléctrico 80L',
      price: 450000,
      comparePrice: 520000,
      transferPrice: 409500,
      stock: 5,
      categoryId: catTermotanques.id,
      brandId: null,
      isFeatured: true,
      freeShipping: true,
      weight: 35,
      tags: ['termotanque', 'eléctrico', '80 litros'],
      images: [
        { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800', alt: 'Termotanque Rheem 80L', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Capacidad', value: '80 Litros' },
        { name: 'Tipo', value: 'Eléctrico' },
        { name: 'Eficiencia', value: 'Clase A' }
      ]
    },
    {
      sku: 'TT-RHEEM-50G',
      name: 'Termotanque a Gas Rheem 50 Litros',
      slug: 'termotanque-gas-rheem-50-litros',
      description: 'Termotanque a gas natural de 50 litros. Recuperación rápida, ideal para uso intensivo.',
      shortDesc: 'Termotanque a gas 50L',
      price: 380000,
      comparePrice: null,
      transferPrice: 345800,
      stock: 7,
      categoryId: catTermotanques.id,
      brandId: null,
      isFeatured: false,
      freeShipping: true,
      weight: 28,
      tags: ['termotanque', 'gas', '50 litros'],
      images: [
        { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800', alt: 'Termotanque Rheem Gas 50L', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Capacidad', value: '50 Litros' },
        { name: 'Tipo', value: 'Gas Natural' },
        { name: 'Recuperación', value: '20 L/hora' }
      ]
    },
    // Bombas
    {
      sku: 'BOM-PRES-01',
      name: 'Bomba Presurizadora Aqua PAB 130',
      slug: 'bomba-presurizadora-aqua-pab-130',
      description: 'Bomba presurizadora automática de 130W. Ideal para aumentar presión en duchas y griferías.',
      shortDesc: 'Presurizadora automática 130W',
      price: 95000,
      comparePrice: 115000,
      transferPrice: 86450,
      stock: 18,
      categoryId: catBombas.id,
      brandId: aqua.id,
      isFeatured: true,
      freeShipping: false,
      weight: 4.5,
      tags: ['bomba', 'presurizadora', 'automática'],
      images: [
        { url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800', alt: 'Bomba Presurizadora Aqua', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Potencia', value: '130W' },
        { name: 'Caudal máximo', value: '25 L/min' },
        { name: 'Tipo', value: 'Automática' }
      ]
    },
    {
      sku: 'BOM-ELEV-01',
      name: 'Bomba Elevadora Aqua BEA 750',
      slug: 'bomba-elevadora-aqua-bea-750',
      description: 'Bomba elevadora de agua de 750W. Para tanques y sistemas de elevación domiciliarios.',
      shortDesc: 'Elevadora 750W para tanques',
      price: 185000,
      comparePrice: null,
      transferPrice: 168350,
      stock: 9,
      categoryId: catBombas.id,
      brandId: aqua.id,
      isFeatured: false,
      freeShipping: false,
      weight: 8,
      tags: ['bomba', 'elevadora', 'tanque'],
      images: [
        { url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800', alt: 'Bomba Elevadora Aqua', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Potencia', value: '750W' },
        { name: 'Altura máxima', value: '35 metros' }
      ]
    },
    // Piazza
    {
      sku: 'PIZ-LINEA-M1',
      name: 'Grifería Monocomando Piazza Linea',
      slug: 'griferia-monocomando-piazza-linea',
      description: 'Grifería monocomando línea Linea de Piazza. Diseño minimalista con cartucho cerámico de alta durabilidad.',
      shortDesc: 'Monocomando minimalista',
      price: 165000,
      comparePrice: 195000,
      transferPrice: 150150,
      stock: 14,
      categoryId: catGriferias.id,
      brandId: piazza.id,
      isFeatured: true,
      freeShipping: false,
      weight: 1.1,
      tags: ['monocomando', 'minimalista', 'cartucho cerámico'],
      images: [
        { url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800', alt: 'Grifería Piazza Linea', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Tipo', value: 'Monocomando' },
        { name: 'Cartucho', value: 'Cerámico' },
        { name: 'Garantía', value: '3 años' }
      ]
    },
    // Roca
    {
      sku: 'ROC-GAP-INO',
      name: 'Inodoro Roca Gap',
      slug: 'inodoro-roca-gap',
      description: 'Inodoro de la línea Gap de Roca. Diseño contemporáneo con sistema de descarga Rimless para mayor higiene.',
      shortDesc: 'Inodoro Rimless contemporáneo',
      price: 420000,
      comparePrice: 480000,
      transferPrice: 382200,
      stock: 4,
      categoryId: catSanitarios.id,
      brandId: roca.id,
      isFeatured: true,
      freeShipping: true,
      weight: 28,
      tags: ['inodoro', 'rimless', 'contemporáneo'],
      images: [
        { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', alt: 'Inodoro Roca Gap', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Sistema', value: 'Rimless' },
        { name: 'Descarga', value: 'Dual 3/4.5L' },
        { name: 'Garantía', value: '10 años' }
      ]
    },
    // DECA
    {
      sku: 'DECA-ASPEN-L',
      name: 'Lavatorio DECA Aspen',
      slug: 'lavatorio-deca-aspen',
      description: 'Lavatorio de sobreponer línea Aspen. Diseño elegante con amplias dimensiones.',
      shortDesc: 'Lavatorio de sobreponer',
      price: 175000,
      comparePrice: null,
      transferPrice: 159250,
      stock: 10,
      categoryId: catSanitarios.id,
      brandId: deca.id,
      isFeatured: false,
      freeShipping: false,
      weight: 15,
      tags: ['lavatorio', 'sobreponer', 'elegante'],
      images: [
        { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', alt: 'Lavatorio DECA Aspen', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Instalación', value: 'Sobreponer' },
        { name: 'Dimensiones', value: '60x45 cm' }
      ]
    },
    // Hogar
    {
      sku: 'HOG-CAL-EL01',
      name: 'Calefactor Eléctrico de Pared 2000W',
      slug: 'calefactor-electrico-pared-2000w',
      description: 'Calefactor eléctrico de pared con termostato digital. 2000W de potencia, silencioso y eficiente.',
      shortDesc: 'Calefactor de pared 2000W',
      price: 125000,
      comparePrice: 145000,
      transferPrice: 113750,
      stock: 20,
      categoryId: catHogar.id,
      brandId: null,
      isFeatured: false,
      freeShipping: false,
      weight: 5,
      tags: ['calefactor', 'eléctrico', 'pared'],
      images: [
        { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', alt: 'Calefactor de pared', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Potencia', value: '2000W' },
        { name: 'Control', value: 'Digital' }
      ]
    },
    // Instalaciones
    {
      sku: 'INS-FLEX-01',
      name: 'Kit Conexión Flexible Acero Inoxidable',
      slug: 'kit-conexion-flexible-acero-inoxidable',
      description: 'Kit de conexiones flexibles de acero inoxidable. Incluye 2 flexibles de 40cm para agua fría y caliente.',
      shortDesc: 'Kit 2 flexibles acero inox 40cm',
      price: 18500,
      comparePrice: null,
      transferPrice: 16835,
      stock: 50,
      categoryId: catInstalaciones.id,
      brandId: null,
      isFeatured: false,
      freeShipping: false,
      weight: 0.3,
      tags: ['flexible', 'conexión', 'acero inoxidable'],
      images: [
        { url: 'https://images.unsplash.com/photo-1581092921461-39b9d4d6f4c8?w=800', alt: 'Kit Conexión Flexible', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Material', value: 'Acero inoxidable' },
        { name: 'Largo', value: '40 cm' },
        { name: 'Cantidad', value: '2 unidades' }
      ]
    },
    {
      sku: 'INS-SIFON-01',
      name: 'Sifón Botella Cromado Universal',
      slug: 'sifon-botella-cromado-universal',
      description: 'Sifón botella cromado para lavatorio. Conexión universal 1 1/4", fácil instalación.',
      shortDesc: 'Sifón botella cromado',
      price: 32000,
      comparePrice: 38000,
      transferPrice: 29120,
      stock: 35,
      categoryId: catInstalaciones.id,
      brandId: null,
      isFeatured: false,
      freeShipping: false,
      weight: 0.5,
      tags: ['sifón', 'cromado', 'lavatorio'],
      images: [
        { url: 'https://images.unsplash.com/photo-1581092921461-39b9d4d6f4c8?w=800', alt: 'Sifón Cromado', isPrimary: true, order: 0 }
      ],
      attributes: [
        { name: 'Material', value: 'Metal cromado' },
        { name: 'Conexión', value: '1 1/4"' }
      ]
    }
  ]

  for (const productData of products) {
    const { images, attributes, ...product } = productData

    const createdProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        ...product,
        price: product.price,
        comparePrice: product.comparePrice,
        transferPrice: product.transferPrice
      }
    })

    // Create images
    for (const image of images) {
      await prisma.productImage.upsert({
        where: {
          id: `${createdProduct.id}-${image.order}`
        },
        update: {},
        create: {
          productId: createdProduct.id,
          url: image.url,
          alt: image.alt,
          isPrimary: image.isPrimary,
          order: image.order
        }
      })
    }

    // Create attributes
    for (const attr of attributes) {
      const attrId = `${createdProduct.id}-${attr.name.toLowerCase().replace(/\s/g, '-')}`
      await prisma.productAttribute.upsert({
        where: { id: attrId },
        update: {},
        create: {
          id: attrId,
          productId: createdProduct.id,
          name: attr.name,
          value: attr.value
        }
      })
    }
  }

  // ==================== SHIPPING ZONES ====================
  console.log('🚚 Creating shipping zones...')
  await Promise.all([
    prisma.shippingZone.upsert({
      where: { id: 'zone-mza-capital' },
      update: {},
      create: {
        id: 'zone-mza-capital',
        name: 'Gran Mendoza',
        province: 'Mendoza',
        cities: ['Capital', 'Godoy Cruz', 'Guaymallén', 'Las Heras', 'Maipú', 'Luján de Cuyo'],
        price: 5500,
        minFree: 200000,
        isActive: true
      }
    }),
    prisma.shippingZone.upsert({
      where: { id: 'zone-mza-interior' },
      update: {},
      create: {
        id: 'zone-mza-interior',
        name: 'Interior Mendoza',
        province: 'Mendoza',
        cities: ['San Rafael', 'General Alvear', 'Malargüe', 'San Martín', 'Rivadavia', 'Junín', 'Tupungato', 'Tunuyán', 'San Carlos'],
        price: 8500,
        minFree: 350000,
        isActive: true
      }
    }),
    prisma.shippingZone.upsert({
      where: { id: 'zone-sj-capital' },
      update: {},
      create: {
        id: 'zone-sj-capital',
        name: 'San Juan Capital',
        province: 'San Juan',
        cities: ['Capital', 'Rawson', 'Rivadavia', 'Santa Lucía', 'Chimbas', 'Pocito'],
        price: 6000,
        minFree: 250000,
        isActive: true
      }
    }),
    prisma.shippingZone.upsert({
      where: { id: 'zone-sj-interior' },
      update: {},
      create: {
        id: 'zone-sj-interior',
        name: 'Interior San Juan',
        province: 'San Juan',
        cities: ['Caucete', 'San Martín', 'Albardón', 'Jáchal', 'Valle Fértil'],
        price: 9500,
        minFree: 400000,
        isActive: true
      }
    })
  ])

  console.log('✅ Seed completed!')
  console.log('📊 Summary:')
  console.log(`   - Settings: 1`)
  console.log(`   - Admin: 1 (admin@katsuda.com.ar / katsuda2024)`)
  console.log(`   - Categories: 6 main + 3 subcategories`)
  console.log(`   - Brands: 6`)
  console.log(`   - Products: ${products.length}`)
  console.log(`   - Shipping Zones: 4`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
