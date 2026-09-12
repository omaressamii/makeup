import { ref, update, get } from 'firebase/database';
import { rtdb } from './config';
import {
  MakeupArtist,
  ClientProfile,
  ServiceCategory,
  MakeupService,
  PortfolioItem,
  ArtistAvailability,
  Booking,
  Review,
  UserProfile,
  AuditLog
} from '../../types';

export const INITIAL_CATEGORIES: ServiceCategory[] = [
  { id: 'cat-bridal', name: 'عرايس وزفاف', description: 'إطلالة زفاف ساحرة تدوم طول الليلة مع تثبيت فائق', slug: 'bridal', sortOrder: 1, isActive: true },
  { id: 'cat-engagement', name: 'خطوبة وكتب كتاب', description: 'لوك رومانسي متألق لحفلات الخطوبة وعقد القران', slug: 'engagement', sortOrder: 2, isActive: true },
  { id: 'cat-glam', name: 'سواريه وفول جلام', description: 'عيون مسحوبة وكونتور بارز وروج ثابت للمناسبات الكبيرة', slug: 'glam', sortOrder: 3, isActive: true },
  { id: 'cat-natural', name: 'طبيعي ونو ميك أب', description: 'بشرة نضرة مفعمة بالحيوية بمظهر طبيعي راقٍ', slug: 'natural', sortOrder: 4, isActive: true },
  { id: 'cat-party', name: 'سهرات واحتفالات', description: 'إطلالات جذابة تخطف الأنظار في السهرات والمناسبات', slug: 'party', sortOrder: 5, isActive: true },
  { id: 'cat-photoshoot', name: 'فوتوسيشن وتصوير', description: 'فنش سينمائي احترافي مهيأ لكاميرات الـ HD والإضاءات', slug: 'photoshoot', sortOrder: 6, isActive: true },
  { id: 'cat-hair-makeup', name: 'ميك أب وتسريحة شعر', description: 'باقة كاملة تجمع بين الميك أب الاحترافي وتسريحة الشعر', slug: 'hair-makeup', sortOrder: 7, isActive: true },
  { id: 'cat-other', name: 'لوكات خاصة وتأثيرات', description: 'لوكات استثنائية وجلسات خاصة حسب الطلب', slug: 'other', sortOrder: 8, isActive: true },
];

export const INITIAL_USERS: Record<string, UserProfile> = {
  'admin-uid-1': {
    uid: 'admin-uid-1',
    email: 'admin@makeupmarketplace.com',
    displayName: 'إدارة المنصة (Super Admin)',
    role: 'admin',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    phone: '01001234567',
    city: 'القاهرة',
    status: 'active',
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now()
  },
  'artist-uid-1': {
    uid: 'artist-uid-1',
    email: 'nour@el-shennawy.com',
    displayName: 'نور الشناوي',
    role: 'artist',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    phone: '01015550142',
    city: 'التجمع الخامس، القاهرة',
    status: 'active',
    createdAt: Date.now() - 60 * 86400000,
    updatedAt: Date.now()
  },
  'artist-uid-2': {
    uid: 'artist-uid-2',
    email: 'dina@fahmy-glam.com',
    displayName: 'دينا فهمي',
    role: 'artist',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    phone: '01125550188',
    city: 'الشيخ زايد، الجيزة',
    status: 'active',
    createdAt: Date.now() - 45 * 86400000,
    updatedAt: Date.now()
  },
  'artist-uid-3': {
    uid: 'artist-uid-3',
    email: 'yasmine@sherifbeauty.com',
    displayName: 'ياسمين شريف',
    role: 'artist',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    phone: '01235550129',
    city: 'مصر الجديدة، القاهرة',
    status: 'active',
    createdAt: Date.now() - 40 * 86400000,
    updatedAt: Date.now()
  },
  'artist-uid-4': {
    uid: 'artist-uid-4',
    email: 'mariam@elsawy-art.com',
    displayName: 'مريم الصاوي',
    role: 'artist',
    photoURL: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
    phone: '01095550177',
    city: 'سموحة، الإسكندرية',
    status: 'active',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now()
  },
  'client-uid-1': {
    uid: 'client-uid-1',
    email: 'sarah.ahmed@gmail.com',
    displayName: 'سارة أحمد',
    role: 'client',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    phone: '01025558833',
    city: 'المعادي، القاهرة',
    status: 'active',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now()
  },
  'client-uid-2': {
    uid: 'client-uid-2',
    email: 'farida.elsherif@gmail.com',
    displayName: 'فريدة الشريف',
    role: 'client',
    photoURL: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    phone: '01145554921',
    city: 'الشيخ زايد، الجيزة',
    status: 'active',
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now()
  }
};

export const INITIAL_ARTISTS: Record<string, MakeupArtist> = {
  'artist-uid-1': {
    artistId: 'artist-uid-1',
    userId: 'artist-uid-1',
    fullName: 'نور الشناوي',
    username: 'nour-elshennawy',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    coverImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
    bio: 'ميك أب آرتست معتمدة بخبرة أكثر من 8 سنوات في تجهيز عرايس القاهرة. متخصصة في لوكات الفول جلام والعرايس الفخمة بأرقى الماركات العالمية الأصلية 100%، ومتاح الحضور في الصالون أو هوم سيرفيس بالبيت.',
    experienceYears: 8,
    location: 'القاهرة - التجمع الخامس',
    serviceArea: 'التجمع، الرحاب، مدينتي، مصر الجديدة، ومتاح السفر للمحافظات',
    phone: '01015550142',
    email: 'nour@el-shennawy.com',
    specialties: ['عرايس وزفاف', 'سواريه VIP', 'تجهيز بشرة', 'كونتور ونحت'],
    rating: 4.9,
    reviewCount: 42,
    isVerified: true,
    isFeatured: true,
    status: 'approved',
    startingPrice: 2500,
    socialLinks: {
      instagram: 'nourelshennawymakeup',
      website: 'https://nourelshennawy.com',
      tiktok: 'nourelshennawy'
    },
    createdAt: Date.now() - 60 * 86400000,
    updatedAt: Date.now()
  },
  'artist-uid-2': {
    artistId: 'artist-uid-2',
    userId: 'artist-uid-2',
    fullName: 'دينا فهمي',
    username: 'dina-fahmy',
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    coverImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    bio: 'خريجة أكاديمية تجميل في باريس ومقيمة في الشيخ زايد. شغفي إبراز الملامح بأسلوب ناعم وأنيق مع لوك الجلاس سكين العصري لجلسات الخطوبة والزفاف والتصوير.',
    experienceYears: 6,
    location: 'الجيزة - الشيخ زايد',
    serviceArea: 'الشيخ زايد، 6 أكتوبر، المهندسين، الزمالك، والدقي',
    phone: '01125550188',
    email: 'dina@fahmy-glam.com',
    specialties: ['خطوبة وسواريه', 'جلاس سكين', 'جلسات تصوير', 'لوكات عصرية'],
    rating: 5.0,
    reviewCount: 28,
    isVerified: true,
    isFeatured: true,
    status: 'approved',
    startingPrice: 2200,
    socialLinks: {
      instagram: 'dinafahmy.makeup',
      website: 'https://dinafahmy.com'
    },
    createdAt: Date.now() - 45 * 86400000,
    updatedAt: Date.now()
  },
  'artist-uid-3': {
    artistId: 'artist-uid-3',
    userId: 'artist-uid-3',
    fullName: 'ياسمين شريف',
    username: 'yasmine-sherif',
    profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    coverImage: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80',
    bio: 'رائدة لوكات "النو ميك أب ميك أب" في مصر الجديدة. بشتغل على جمال البشرة ونضارتها الطبيعية بدون طبقات تقيلة، مع لمسة كلاسيكية هادية تدوم طول اليوم.',
    experienceYears: 5,
    location: 'القاهرة - مصر الجديدة',
    serviceArea: 'مصر الجديدة، مدينة نصر، المعادي، وشيراتون',
    phone: '01235550129',
    email: 'yasmine@sherifbeauty.com',
    specialties: ['طبيعي ونو ميك أب', 'عرايس هادية', 'سوفت جلام', 'صباحية وكتب كتاب'],
    rating: 4.8,
    reviewCount: 35,
    isVerified: true,
    isFeatured: false,
    status: 'approved',
    startingPrice: 1800,
    socialLinks: {
      instagram: 'yasminesherif.beauty'
    },
    createdAt: Date.now() - 40 * 86400000,
    updatedAt: Date.now()
  },
  'artist-uid-4': {
    artistId: 'artist-uid-4',
    userId: 'artist-uid-4',
    fullName: 'مريم الصاوي',
    username: 'mariam-elsawy',
    profileImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
    coverImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80',
    bio: 'أشهر ميك أب آرتست في الإسكندرية لعرائس الصيف والساحل الشمالي. متخصصة في رسمات العيون العربية الفخمة ورسمات الشفايف المميزة مع ثبات كامل لأكثر من 16 ساعة.',
    experienceYears: 7,
    location: 'الإسكندرية - سموحة',
    serviceArea: 'الإسكندرية، الساحل الشمالي، العلمين الجديدة، والبحيرة',
    phone: '01095550177',
    email: 'mariam@elsawy-art.com',
    specialties: ['عرايس ملكي', 'سواريه عالي الثبات', 'سحبة العيون', 'عرايس الساحل'],
    rating: 4.9,
    reviewCount: 53,
    isVerified: true,
    isFeatured: true,
    status: 'approved',
    startingPrice: 2800,
    socialLinks: {
      instagram: 'mariamelsawy_mua',
      tiktok: 'mariamelsawy'
    },
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now()
  }
};

export const INITIAL_CLIENTS: Record<string, ClientProfile> = {
  'client-uid-1': {
    clientId: 'client-uid-1',
    userId: 'client-uid-1',
    fullName: 'سارة أحمد',
    email: 'sarah.ahmed@gmail.com',
    phone: '01025558833',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    location: 'المعادي، القاهرة',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now()
  },
  'client-uid-2': {
    clientId: 'client-uid-2',
    userId: 'client-uid-2',
    fullName: 'فريدة الشريف',
    email: 'farida.elsherif@gmail.com',
    phone: '01145554921',
    profileImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    location: 'الشيخ زايد، الجيزة',
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now()
  }
};

export const INITIAL_SERVICES: Record<string, MakeupService> = {
  'srv-1': {
    serviceId: 'srv-1',
    artistId: 'artist-uid-1',
    name: 'باكدج العروسة الملكي VIP',
    description: 'جلسة ميك أب زفاف متكاملة تشمل تهيئة عميقة للبشرة، كونتور إيربراش، رموش منك طبيعية، وتثبيت ضد الماء والدموع يدوم طول الفرح.',
    price: 5500,
    duration: 120,
    categoryId: 'cat-bridal',
    categoryName: 'عرايس وزفاف',
    isActive: true,
    createdAt: Date.now() - 50 * 86400000,
    updatedAt: Date.now()
  },
  'srv-2': {
    serviceId: 'srv-2',
    artistId: 'artist-uid-1',
    name: 'ميك أب سواريه وسهرة فاخر',
    description: 'لوك سواريه فخم برسمة عيون سموكي أو شيمر مميزة، نحت الملامح وتحديد الشفاه ببراندات عالمية.',
    price: 2500,
    duration: 60,
    categoryId: 'cat-glam',
    categoryName: 'سواريه وفول جلام',
    isActive: true,
    createdAt: Date.now() - 50 * 86400000,
    updatedAt: Date.now()
  },
  'srv-3': {
    serviceId: 'srv-3',
    artistId: 'artist-uid-1',
    name: 'ميك أب وصيفة العروسة / أخت العروسة',
    description: 'إطلالة أنيقة متناسقة مع ألوان ثيم الفرح، تشمل رموش خفيفة وتثبيت لساعات طويلة.',
    price: 1800,
    duration: 50,
    categoryId: 'cat-party',
    categoryName: 'سهرات واحتفالات',
    isActive: true,
    createdAt: Date.now() - 48 * 86400000,
    updatedAt: Date.now()
  },
  'srv-4': {
    serviceId: 'srv-4',
    artistId: 'artist-uid-2',
    name: 'ميك أب خطوبة وفوتوسيشن فوتوجينيك',
    description: 'ميك أب متوازن مصمم خصيصاً لإضاءات الكاميرا والـ HD مع إبراز نضارة الوجه.',
    price: 3200,
    duration: 80,
    categoryId: 'cat-engagement',
    categoryName: 'خطوبة وكتب كتاب',
    isActive: true,
    createdAt: Date.now() - 40 * 86400000,
    updatedAt: Date.now()
  },
  'srv-5': {
    serviceId: 'srv-5',
    artistId: 'artist-uid-2',
    name: 'لوك باريسي سوفت ناتشورال',
    description: 'إطلالة أوروبية ساحرة ببشرة زجاجية مشرقة، آيلاينر ناعم، وحواجب طبيعية جذابة.',
    price: 2200,
    duration: 60,
    categoryId: 'cat-natural',
    categoryName: 'طبيعي ونو ميك أب',
    isActive: true,
    createdAt: Date.now() - 40 * 86400000,
    updatedAt: Date.now()
  },
  'srv-6': {
    serviceId: 'srv-6',
    artistId: 'artist-uid-3',
    name: 'باكدج كتب الكتاب والصباحية الهادئ',
    description: 'ترطيب عميق، تصحيح دقيق للعيوب بدون ثقل، باقة رموش فردية طبيعية، وتلوين شفاه ناعم.',
    price: 2600,
    duration: 75,
    categoryId: 'cat-engagement',
    categoryName: 'خطوبة وكتب كتاب',
    isActive: true,
    createdAt: Date.now() - 35 * 86400000,
    updatedAt: Date.now()
  },
  'srv-7': {
    serviceId: 'srv-7',
    artistId: 'artist-uid-3',
    name: 'ميك أب سوفت ناتشورال للمناسبات',
    description: 'بشرة برونزية دافئة وظلال عيون شيمر خفيفة تلائم إضاءة الشمس والنهارات.',
    price: 1800,
    duration: 60,
    categoryId: 'cat-natural',
    categoryName: 'طبيعي ونو ميك أب',
    isActive: true,
    createdAt: Date.now() - 35 * 86400000,
    updatedAt: Date.now()
  },
  'srv-8': {
    serviceId: 'srv-8',
    artistId: 'artist-uid-4',
    name: 'باكدج العروسة الملكي الإسكندراني',
    description: 'رسمة عيون مسحوبة، كونتور ثلاثي الأبعاد، مثبت قوي جداً لجو الرطوبة والبحر، ومساعدة في تثبيت الطرحة والإكسسوارات.',
    price: 6000,
    duration: 130,
    categoryId: 'cat-bridal',
    categoryName: 'عرايس وزفاف',
    isActive: true,
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now()
  }
};

export const INITIAL_PORTFOLIO: Record<string, PortfolioItem> = {
  'port-1': {
    portfolioId: 'port-1',
    artistId: 'artist-uid-1',
    imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=80',
    title: 'عروسة التجمع الخامس - لوك دافئ ملكي',
    description: 'هايلايت شامبين مع درجات خوخية ناعمة وشفايف مخملية لفرح في فندق كمبينسكي.',
    categoryId: 'cat-bridal',
    categoryName: 'عرايس وزفاف',
    sortOrder: 1,
    createdAt: Date.now() - 40 * 86400000,
    updatedAt: Date.now()
  },
  'port-2': {
    portfolioId: 'port-2',
    artistId: 'artist-uid-1',
    imageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
    title: 'سواريه مسائي فخم برسمة عيون مسحوبة',
    description: 'سموكي شيك مع لمسة كروم عند مدمع العين وبشرة زجاجية خالية من العيوب.',
    categoryId: 'cat-glam',
    categoryName: 'سواريه وفول جلام',
    sortOrder: 2,
    createdAt: Date.now() - 35 * 86400000,
    updatedAt: Date.now()
  },
  'port-3': {
    portfolioId: 'port-3',
    artistId: 'artist-uid-1',
    imageUrl: 'https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?auto=format&fit=crop&w=1000&q=80',
    title: 'جلسة تصوير خطوبة نهارية',
    description: 'لوك نضارة وإشراقة طبيعية مخصصة لإضاءة الشمس واللقطات المفتوحة.',
    categoryId: 'cat-engagement',
    categoryName: 'خطوبة وكتب كتاب',
    sortOrder: 3,
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now()
  },
  'port-4': {
    portfolioId: 'port-4',
    artistId: 'artist-uid-2',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
    title: 'لوك فوتوسيشن زايد العصري',
    description: 'آيلاينر جرافيك ناعم وبشرة نضرة خالية من اللمعان الزائد لمجلة أزياء.',
    categoryId: 'cat-photoshoot',
    categoryName: 'فوتوسيشن وتصوير',
    sortOrder: 1,
    createdAt: Date.now() - 38 * 86400000,
    updatedAt: Date.now()
  },
  'port-5': {
    portfolioId: 'port-5',
    artistId: 'artist-uid-2',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    title: 'لوك سوفت جلام رومانسي',
    description: 'درجات النيود والعنبر الدافئ مع شفايف حريرية مناسبة للخطوبة وكتب الكتاب.',
    categoryId: 'cat-natural',
    categoryName: 'طبيعي ونو ميك أب',
    sortOrder: 2,
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now()
  },
  'port-6': {
    portfolioId: 'port-6',
    artistId: 'artist-uid-3',
    imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1000&q=80',
    title: 'عروسة ناتشورال كلاسيكية - مصر الجديدة',
    description: 'فنش مات ناعم وبشرة حريرية مع حواجب طبيعية وتحديد شفاه خفيف.',
    categoryId: 'cat-bridal',
    categoryName: 'عرايس وزفاف',
    sortOrder: 1,
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now()
  },
  'port-7': {
    portfolioId: 'port-7',
    artistId: 'artist-uid-4',
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=80',
    title: 'عروسة الساحل الملكية - إطلالة فخمة',
    description: 'دمج ظلال برونزي مع جليتر ألماسي وبريق ساحر وكونتور متقن للمساء.',
    categoryId: 'cat-bridal',
    categoryName: 'عرايس وزفاف',
    sortOrder: 1,
    createdAt: Date.now() - 22 * 86400000,
    updatedAt: Date.now()
  }
};

export const INITIAL_AVAILABILITY: Record<string, ArtistAvailability> = {
  'artist-uid-1': {
    artistId: 'artist-uid-1',
    workingDays: {
      monday: { enabled: true, start: '10:00', end: '20:00' },
      tuesday: { enabled: true, start: '10:00', end: '20:00' },
      wednesday: { enabled: true, start: '10:00', end: '20:00' },
      thursday: { enabled: true, start: '10:00', end: '22:00' },
      friday: { enabled: true, start: '09:00', end: '23:00' },
      saturday: { enabled: true, start: '09:00', end: '22:00' },
      sunday: { enabled: true, start: '11:00', end: '19:00' }
    },
    breakTimes: {
      monday: [{ start: '14:00', end: '15:00' }],
      tuesday: [{ start: '14:00', end: '15:00' }],
      wednesday: [{ start: '14:00', end: '15:00' }],
      thursday: [{ start: '14:00', end: '15:00' }],
      friday: [{ start: '14:00', end: '15:00' }],
      saturday: [{ start: '14:00', end: '15:00' }],
      sunday: [{ start: '14:00', end: '15:00' }]
    },
    unavailableDates: {},
    slotIntervalMinutes: 30
  },
  'artist-uid-2': {
    artistId: 'artist-uid-2',
    workingDays: {
      monday: { enabled: false, start: '10:00', end: '18:00' },
      tuesday: { enabled: true, start: '10:00', end: '20:00' },
      wednesday: { enabled: true, start: '10:00', end: '20:00' },
      thursday: { enabled: true, start: '10:00', end: '21:00' },
      friday: { enabled: true, start: '09:00', end: '22:00' },
      saturday: { enabled: true, start: '09:00', end: '21:00' },
      sunday: { enabled: true, start: '11:00', end: '18:00' }
    },
    breakTimes: {
      tuesday: [{ start: '14:00', end: '15:00' }],
      wednesday: [{ start: '14:00', end: '15:00' }],
      thursday: [{ start: '14:00', end: '15:00' }],
      friday: [{ start: '14:00', end: '15:00' }],
      saturday: [{ start: '14:00', end: '15:00' }]
    },
    unavailableDates: {},
    slotIntervalMinutes: 30
  }
};

export const INITIAL_BOOKINGS: Record<string, Booking> = {
  'bk-1': {
    bookingId: 'bk-1',
    artistId: 'artist-uid-1',
    artistName: 'نور الشناوي',
    artistImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    clientId: 'client-uid-1',
    clientName: 'سارة أحمد',
    clientEmail: 'sarah.ahmed@gmail.com',
    clientPhone: '01025558833',
    serviceId: 'srv-1',
    serviceName: 'باكدج العروسة الملكي VIP',
    price: 5500,
    duration: 120,
    date: '2026-09-02',
    startTime: '13:00',
    endTime: '15:00',
    status: 'completed',
    notes: 'الفرح في قاعة فندق الماسة، محتاجة أندر تون خوخي دافي وتثبيت قوي.',
    hasReview: true,
    createdAt: Date.now() - 12 * 86400000,
    updatedAt: Date.now() - 10 * 86400000
  },
  'bk-2': {
    bookingId: 'bk-2',
    artistId: 'artist-uid-1',
    artistName: 'نور الشناوي',
    artistImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    clientId: 'client-uid-1',
    clientName: 'سارة أحمد',
    clientEmail: 'sarah.ahmed@gmail.com',
    clientPhone: '01025558833',
    serviceId: 'srv-2',
    serviceName: 'ميك أب سواريه وسهرة فاخر',
    price: 2500,
    duration: 60,
    date: '2026-09-20',
    startTime: '16:00',
    endTime: '17:00',
    status: 'confirmed',
    notes: 'حفلة تخرج في دار الأوبرا، عايزة روج نبيتي غامق ورسمة عين مميزة.',
    createdAt: Date.now() - 3 * 86400000,
    updatedAt: Date.now() - 2 * 86400000
  },
  'bk-3': {
    bookingId: 'bk-3',
    artistId: 'artist-uid-2',
    artistName: 'دينا فهمي',
    artistImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    clientId: 'client-uid-2',
    clientName: 'فريدة الشريف',
    clientEmail: 'farida.elsherif@gmail.com',
    clientPhone: '01145554921',
    serviceId: 'srv-4',
    serviceName: 'ميك أب خطوبة وفوتوسيشن فوتوجينيك',
    price: 3200,
    duration: 80,
    date: '2026-09-22',
    startTime: '12:00',
    endTime: '13:20',
    status: 'pending',
    notes: 'سيشن تصوير كاجوال في حديقة فيلا بالشيخ زايد.',
    createdAt: Date.now() - 1 * 86400000,
    updatedAt: Date.now() - 1 * 86400000
  }
};

export const INITIAL_REVIEWS: Record<string, Review> = {
  'rev-1': {
    reviewId: 'rev-1',
    bookingId: 'bk-1',
    artistId: 'artist-uid-1',
    clientId: 'client-uid-1',
    clientName: 'سارة أحمد',
    clientPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    rating: 5,
    comment: 'نور خلتني حاسة إني ملكة بجد في يوم فرحي! الميك أب فضل ثابت زي ماهو من أول اليوم لحد آخر السهرة ومن غير ما يتأثر بالدموع ولا الرطوبة. ذوقها راقي جداً ومواعيدها بالدقيقة ومريحة نفسياً.',
    serviceName: 'باكدج العروسة الملكي VIP',
    createdAt: Date.now() - 10 * 86400000,
    updatedAt: Date.now() - 10 * 86400000
  }
};

export const INITIAL_AUDIT_LOGS: Record<string, AuditLog> = {
  'log-1': {
    logId: 'log-1',
    actorId: 'admin-uid-1',
    actorName: 'إدارة المنصة',
    actorRole: 'admin',
    action: 'ARTIST_VERIFIED',
    targetId: 'artist-uid-1',
    targetType: 'artist',
    timestamp: Date.now() - 50 * 86400000,
    metadata: { note: 'تم التحقق من أعمال الميك أب آرتست وسجل الشهادات' }
  },
  'log-2': {
    logId: 'log-2',
    actorId: 'artist-uid-1',
    actorName: 'نور الشناوي',
    actorRole: 'artist',
    action: 'BOOKING_CONFIRMED',
    targetId: 'bk-2',
    targetType: 'booking',
    timestamp: Date.now() - 2 * 86400000,
    metadata: { serviceName: 'ميك أب سواريه وسهرة فاخر' }
  }
};

/**
 * Initializes the Firebase Realtime Database with starter data if empty,
 * or allows an Admin to force re-seed.
 */
export async function seedMarketplaceDatabase(force = false): Promise<{ success: boolean; message: string }> {
  try {
    const categoriesSnap = await get(ref(rtdb, 'categories'));
    if (categoriesSnap.exists() && !force) {
      return { success: true, message: 'قاعدة البيانات مُهيأة بالفعل.' };
    }

    const categoriesMap: Record<string, ServiceCategory> = {};
    INITIAL_CATEGORIES.forEach(c => { categoriesMap[c.id] = c; });

    // Structured database nodes (strictly alphanumeric keys without slashes)
    const updates: Record<string, any> = {
      categories: categoriesMap,
      users: INITIAL_USERS,
      artists: INITIAL_ARTISTS,
      clients: INITIAL_CLIENTS,
      services: INITIAL_SERVICES,
      portfolio: INITIAL_PORTFOLIO,
      availability: INITIAL_AVAILABILITY,
      bookings: INITIAL_BOOKINGS,
      reviews: INITIAL_REVIEWS,
      auditLogs: INITIAL_AUDIT_LOGS,
      settings: {
        platformFeePercent: 10,
        minBookingAdvanceHours: 12,
        featuredArtistIds: ['artist-uid-1', 'artist-uid-2', 'artist-uid-4'],
        systemNotice: 'أهلاً بيكي في المنصة الأولى لحجز أشهر الميك أب آرتست في مصر. تصفحي الأعمال واحجزي ميعادك فوراً.'
      },
      favorites: {
        'client-uid-1': {
          'artist-uid-1': true,
          'artist-uid-2': true
        }
      },
      bookingsByArtist: {
        'artist-uid-1': {
          'bk-1': true,
          'bk-2': true
        },
        'artist-uid-2': {
          'bk-3': true
        }
      },
      bookingsByClient: {
        'client-uid-1': {
          'bk-1': true,
          'bk-2': true
        },
        'client-uid-2': {
          'bk-3': true
        }
      },
      reviewsByArtist: {
        'artist-uid-1': {
          'rev-1': true
        }
      }
    };

    await update(ref(rtdb), updates);
    return { success: true, message: 'تم تهيئة وتحديث بيانات المنصة بنجاح!' };
  } catch (err: any) {
    console.error('Error seeding Firebase Realtime Database:', err);
    return { success: false, message: err.message || 'فشل في تهيئة قاعدة البيانات' };
  }
}
