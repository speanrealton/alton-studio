// Language translations for the platform
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'zh' | 'ko' | 'ar' | 'hi';

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Navigation
    'nav.studio': 'Studio',
    'nav.marketplace': 'Alton Feed',
    'nav.community': 'Community',
    'nav.designs': 'Alton Designs',
    'nav.print': 'Print',
    'nav.settings': 'Settings',
    'nav.create': 'Create',
    'nav.templates': 'Templates',
    'nav.magic': 'Alton Magic',
    
    // Buttons
    'btn.save': 'Save',
    'btn.cancel': 'Cancel',
    'btn.approve': 'Approve',
    'btn.reject': 'Reject',
    'btn.update': 'Update',
    'btn.change': 'Change',
    'btn.logout': 'Logout',
    'btn.signin': 'Sign In',
    
    // Account
    'account.email': 'Email',
    'account.password': 'New password',
    'account.language': 'Language',
    
    // Settings
    'settings.profile': 'Profile',
    'settings.account': 'Account',
    'settings.security': 'Security',
    'settings.notifications': 'Notifications',
    'settings.preferences': 'Preferences',
    'settings.data': 'Data',

    // Print Network
    'print.search': 'Search printers',
    'print.filter': 'Filters',
    'print.noResults': 'No printers found',
    'print.viewDetails': 'View Details',
    'print.requestQuote': 'Request Quote',
    'print.loading': 'Loading...',
    'print.printers': 'Printers',
    'print.countries': 'Countries',
    
    // Categories
    'category.tshirt': 'T-Shirts',
    'category.businesscard': 'Business Cards',
    'category.poster': 'Posters',
    'category.canvas': 'Canvas',
    'category.packaging': 'Packaging',
    'category.promotional': 'Promotional',
    'category.largeformat': 'Large Format',
    'category.3dprinting': '3D Print',
  },
  
  es: {
    // Navigation
    'nav.studio': 'Estudio',
    'nav.marketplace': 'Alton Feed',
    'nav.community': 'Comunidad',
    'nav.designs': 'Diseños Alton',
    'nav.print': 'Impresión',
    'nav.settings': 'Configuración',
    'nav.create': 'Crear',
    'nav.templates': 'Plantillas',
    'nav.magic': 'Magia Alton',
    
    // Buttons
    'btn.save': 'Guardar',
    'btn.cancel': 'Cancelar',
    'btn.approve': 'Aprobar',
    'btn.reject': 'Rechazar',
    'btn.update': 'Actualizar',
    'btn.change': 'Cambiar',
    'btn.logout': 'Cerrar sesión',
    'btn.signin': 'Iniciar sesión',
    
    // Account
    'account.email': 'Correo electrónico',
    'account.password': 'Nueva contraseña',
    'account.language': 'Idioma',
    
    // Settings
    'settings.profile': 'Perfil',
    'settings.account': 'Cuenta',
    'settings.security': 'Seguridad',
    'settings.notifications': 'Notificaciones',
    'settings.preferences': 'Preferencias',
    'settings.data': 'Datos',

    // Print Network
    'print.search': 'Buscar impresoras',
    'print.filter': 'Filtros',
    'print.noResults': 'No se encontraron impresoras',
    'print.viewDetails': 'Ver detalles',
    'print.requestQuote': 'Solicitar presupuesto',
    'print.loading': 'Cargando...',
    'print.printers': 'Impresoras',
    'print.countries': 'Países',
    
    // Categories
    'category.tshirt': 'Camisetas',
    'category.businesscard': 'Tarjetas de visita',
    'category.poster': 'Pósters',
    'category.canvas': 'Lienzo',
    'category.packaging': 'Embalaje',
    'category.promotional': 'Promocional',
    'category.largeformat': 'Formato grande',
    'category.3dprinting': 'Impresión 3D',
  },
  
  fr: {
    // Navigation
    'nav.studio': 'Studio',
    'nav.marketplace': 'Alton Feed',
    'nav.community': 'Communauté',
    'nav.designs': 'Designs Alton',
    'nav.print': 'Impression',
    'nav.settings': 'Paramètres',
    'nav.create': 'Créer',
    'nav.templates': 'Modèles',
    'nav.magic': 'Magie Alton',
    
    // Buttons
    'btn.save': 'Enregistrer',
    'btn.cancel': 'Annuler',
    'btn.approve': 'Approuver',
    'btn.reject': 'Rejeter',
    'btn.update': 'Mettre à jour',
    'btn.change': 'Changer',
    'btn.logout': 'Déconnexion',
    'btn.signin': 'Se connecter',
    
    // Account
    'account.email': 'E-mail',
    'account.password': 'Nouveau mot de passe',
    'account.language': 'Langue',
    
    // Settings
    'settings.profile': 'Profil',
    'settings.account': 'Compte',
    'settings.security': 'Sécurité',
    'settings.notifications': 'Notifications',
    'settings.preferences': 'Préférences',
    'settings.data': 'Données',

    // Print Network
    'print.search': 'Rechercher des imprimantes',
    'print.filter': 'Filtres',
    'print.noResults': 'Aucune imprimante trouvée',
    'print.viewDetails': 'Voir les détails',
    'print.requestQuote': 'Demander un devis',
    'print.loading': 'Chargement...',
    'print.printers': 'Imprimantes',
    'print.countries': 'Pays',
    
    // Categories
    'category.tshirt': 'T-Shirts',
    'category.businesscard': 'Cartes de visite',
    'category.poster': 'Affiches',
    'category.canvas': 'Toile',
    'category.packaging': 'Emballage',
    'category.promotional': 'Promotion',
    'category.largeformat': 'Grand format',
    'category.3dprinting': 'Impression 3D',
  },
  
  de: {
    // Navigation
    'nav.studio': 'Studio',
    'nav.marketplace': 'Alton Feed',
    'nav.community': 'Gemeinschaft',
    'nav.designs': 'Alton Designs',
    'nav.print': 'Druck',
    'nav.settings': 'Einstellungen',
    'nav.create': 'Erstellen',
    'nav.templates': 'Vorlagen',
    'nav.magic': 'Alton Magie',
    
    // Buttons
    'btn.save': 'Speichern',
    'btn.cancel': 'Abbrechen',
    'btn.approve': 'Genehmigen',
    'btn.reject': 'Ablehnen',
    'btn.update': 'Aktualisieren',
    'btn.change': 'Ändern',
    'btn.logout': 'Abmelden',
    'btn.signin': 'Anmelden',
    
    // Account
    'account.email': 'E-Mail',
    'account.password': 'Neues Passwort',
    'account.language': 'Sprache',
    
    // Settings
    'settings.profile': 'Profil',
    'settings.account': 'Konto',
    'settings.security': 'Sicherheit',
    'settings.notifications': 'Benachrichtigungen',
    'settings.preferences': 'Einstellungen',
    'settings.data': 'Daten',

    // Print Network
    'print.search': 'Drucker suchen',
    'print.filter': 'Filter',
    'print.noResults': 'Keine Drucker gefunden',
    'print.viewDetails': 'Details anzeigen',
    'print.requestQuote': 'Angebot anfordern',
    'print.loading': 'Wird geladen...',
    'print.printers': 'Drucker',
    'print.countries': 'Länder',
    
    // Categories
    'category.tshirt': 'T-Shirts',
    'category.businesscard': 'Visitenkarten',
    'category.poster': 'Plakate',
    'category.canvas': 'Leinwand',
    'category.packaging': 'Verpackung',
    'category.promotional': 'Werbe',
    'category.largeformat': 'Großformat',
    'category.3dprinting': '3D-Druck',
  },
  
  it: {
    // Navigation
    'nav.studio': 'Studio',
    'nav.marketplace': 'Alton Feed',
    'nav.community': 'Comunità',
    'nav.designs': 'Design Alton',
    'nav.print': 'Stampa',
    'nav.settings': 'Impostazioni',
    'nav.create': 'Crea',
    'nav.templates': 'Modelli',
    'nav.magic': 'Magia Alton',
    
    // Buttons
    'btn.save': 'Salva',
    'btn.cancel': 'Annulla',
    'btn.approve': 'Approva',
    'btn.reject': 'Rifiuta',
    'btn.update': 'Aggiorna',
    'btn.change': 'Cambia',
    'btn.logout': 'Esci',
    'btn.signin': 'Accedi',
    
    // Account
    'account.email': 'Email',
    'account.password': 'Nuova password',
    'account.language': 'Lingua',
    
    // Settings
    'settings.profile': 'Profilo',
    'settings.account': 'Account',
    'settings.security': 'Sicurezza',
    'settings.notifications': 'Notifiche',
    'settings.preferences': 'Preferenze',
    'settings.data': 'Dati',

    // Print Network
    'print.search': 'Cerca stampanti',
    'print.filter': 'Filtri',
    'print.noResults': 'Nessuna stampante trovata',
    'print.viewDetails': 'Visualizza dettagli',
    'print.requestQuote': 'Richiedi preventivo',
    'print.loading': 'Caricamento...',
    'print.printers': 'Stampanti',
    'print.countries': 'Paesi',
    
    // Categories
    'category.tshirt': 'T-Shirt',
    'category.businesscard': 'Biglietti da visita',
    'category.poster': 'Poster',
    'category.canvas': 'Tela',
    'category.packaging': 'Imballaggio',
    'category.promotional': 'Promozionale',
    'category.largeformat': 'Grande formato',
    'category.3dprinting': 'Stampa 3D',
  },
  
  pt: {
    // Navigation
    'nav.studio': 'Estúdio',
    'nav.marketplace': 'Alton Feed',
    'nav.community': 'Comunidade',
    'nav.designs': 'Designs Alton',
    'nav.print': 'Impressão',
    'nav.settings': 'Configurações',
    'nav.create': 'Criar',
    'nav.templates': 'Modelos',
    'nav.magic': 'Magia Alton',
    
    // Buttons
    'btn.save': 'Salvar',
    'btn.cancel': 'Cancelar',
    'btn.approve': 'Aprovar',
    'btn.reject': 'Rejeitar',
    'btn.update': 'Atualizar',
    'btn.change': 'Mudar',
    'btn.logout': 'Sair',
    'btn.signin': 'Conectar',
    
    // Account
    'account.email': 'Email',
    'account.password': 'Nova senha',
    'account.language': 'Idioma',
    
    // Settings
    'settings.profile': 'Perfil',
    'settings.account': 'Conta',
    'settings.security': 'Segurança',
    'settings.notifications': 'Notificações',
    'settings.preferences': 'Preferências',
    'settings.data': 'Dados',

    // Print Network
    'print.search': 'Pesquisar impressoras',
    'print.filter': 'Filtros',
    'print.noResults': 'Nenhuma impressora encontrada',
    'print.viewDetails': 'Ver detalhes',
    'print.requestQuote': 'Solicitar orçamento',
    'print.loading': 'Carregando...',
    'print.printers': 'Impressoras',
    'print.countries': 'Países',
    
    // Categories
    'category.tshirt': 'Camisetas',
    'category.businesscard': 'Cartões de visita',
    'category.poster': 'Pôsteres',
    'category.canvas': 'Tela',
    'category.packaging': 'Embalagem',
    'category.promotional': 'Promocional',
    'category.largeformat': 'Grande formato',
    'category.3dprinting': 'Impressão 3D',
  },
  
  ru: {
    // Navigation
    'nav.studio': 'Студия',
    'nav.marketplace': 'Alton Feed',
    'nav.community': 'Сообщество',
    'nav.designs': 'Дизайны Alton',
    'nav.print': 'Печать',
    'nav.settings': 'Настройки',
    'nav.create': 'Создать',
    'nav.templates': 'Шаблоны',
    'nav.magic': 'Волшебство Alton',
    
    // Buttons
    'btn.save': 'Сохранить',
    'btn.cancel': 'Отмена',
    'btn.approve': 'Одобрить',
    'btn.reject': 'Отклонить',
    'btn.update': 'Обновить',
    'btn.change': 'Изменить',
    'btn.logout': 'Выход',
    'btn.signin': 'Вход',
    
    // Account
    'account.email': 'Электронная почта',
    'account.password': 'Новый пароль',
    'account.language': 'Язык',
    
    // Settings
    'settings.profile': 'Профиль',
    'settings.account': 'Аккаунт',
    'settings.security': 'Безопасность',
    'settings.notifications': 'Уведомления',
    'settings.preferences': 'Предпочтения',
    'settings.data': 'Данные',

    // Print Network
    'print.search': 'Поиск принтеров',
    'print.filter': 'Фильтры',
    'print.noResults': 'Принтеры не найдены',
    'print.viewDetails': 'Просмотр деталей',
    'print.requestQuote': 'Запросить предложение',
    'print.loading': 'Загрузка...',
    'print.printers': 'Принтеры',
    'print.countries': 'Страны',
    
    // Categories
    'category.tshirt': 'Футболки',
    'category.businesscard': 'Визитные карточки',
    'category.poster': 'Плакаты',
    'category.canvas': 'Холст',
    'category.packaging': 'Упаковка',
    'category.promotional': 'Рекламная',
    'category.largeformat': 'Большой формат',
    'category.3dprinting': '3D печать',
  },
  
  ja: {
    // Navigation
    'nav.studio': 'スタジオ',
    'nav.marketplace': 'Alton フィード',
    'nav.community': 'コミュニティ',
    'nav.designs': 'Alton デザイン',
    'nav.print': '印刷',
    'nav.settings': '設定',
    'nav.create': '作成',
    'nav.templates': 'テンプレート',
    'nav.magic': 'Alton マジック',
    
    // Buttons
    'btn.save': '保存',
    'btn.cancel': 'キャンセル',
    'btn.approve': '承認',
    'btn.reject': '却下',
    'btn.update': '更新',
    'btn.change': '変更',
    'btn.logout': 'ログアウト',
    'btn.signin': 'サインイン',
    
    // Account
    'account.email': 'メール',
    'account.password': '新しいパスワード',
    'account.language': '言語',
    
    // Settings
    'settings.profile': 'プロフィール',
    'settings.account': 'アカウント',
    'settings.security': 'セキュリティ',
    'settings.notifications': '通知',
    'settings.preferences': '設定',
    'settings.data': 'データ',

    // Print Network
    'print.search': 'プリンタを検索',
    'print.filter': 'フィルター',
    'print.noResults': 'プリンタが見つかりません',
    'print.viewDetails': '詳細を表示',
    'print.requestQuote': '見積もりをリクエスト',
    'print.loading': '読み込み中...',
    'print.printers': 'プリンタ',
    'print.countries': '国',
    
    // Categories
    'category.tshirt': 'Tシャツ',
    'category.businesscard': '名刺',
    'category.poster': 'ポスター',
    'category.canvas': 'キャンバス',
    'category.packaging': 'パッケージング',
    'category.promotional': 'プロモーション',
    'category.largeformat': '大判',
    'category.3dprinting': '3D印刷',
  },
  
  zh: {
    // Navigation
    'nav.studio': '工作室',
    'nav.marketplace': 'Alton 资源',
    'nav.community': '社区',
    'nav.designs': 'Alton 设计',
    'nav.print': '打印',
    'nav.settings': '设置',
    'nav.create': '创建',
    'nav.templates': '模板',
    'nav.magic': 'Alton 魔法',
    
    // Buttons
    'btn.save': '保存',
    'btn.cancel': '取消',
    'btn.approve': '批准',
    'btn.reject': '拒绝',
    'btn.update': '更新',
    'btn.change': '改变',
    'btn.logout': '注销',
    'btn.signin': '登录',
    
    // Account
    'account.email': '电子邮件',
    'account.password': '新密码',
    'account.language': '语言',
    
    // Settings
    'settings.profile': '个人资料',
    'settings.account': '账户',
    'settings.security': '安全',
    'settings.notifications': '通知',
    'settings.preferences': '偏好',
    'settings.data': '数据',

    // Print Network
    'print.search': '搜索打印机',
    'print.filter': '过滤器',
    'print.noResults': '找不到打印机',
    'print.viewDetails': '查看详情',
    'print.requestQuote': '请求报价',
    'print.loading': '加载中...',
    'print.printers': '打印机',
    'print.countries': '国家',
    
    // Categories
    'category.tshirt': 'T恤',
    'category.businesscard': '名片',
    'category.poster': '海报',
    'category.canvas': '帆布',
    'category.packaging': '包装',
    'category.promotional': '促销',
    'category.largeformat': '大格式',
    'category.3dprinting': '3D打印',
  },
  
  ko: {
    // Navigation
    'nav.studio': '스튜디오',
    'nav.marketplace': 'Alton 피드',
    'nav.community': '커뮤니티',
    'nav.designs': 'Alton 디자인',
    'nav.print': '인쇄',
    'nav.settings': '설정',
    'nav.create': '만들기',
    'nav.templates': '템플릿',
    'nav.magic': 'Alton 마법',
    
    // Buttons
    'btn.save': '저장',
    'btn.cancel': '취소',
    'btn.approve': '승인',
    'btn.reject': '거부',
    'btn.update': '업데이트',
    'btn.change': '변경',
    'btn.logout': '로그아웃',
    'btn.signin': '로그인',
    
    // Account
    'account.email': '이메일',
    'account.password': '새 비밀번호',
    'account.language': '언어',
    
    // Settings
    'settings.profile': '프로필',
    'settings.account': '계정',
    'settings.security': '보안',
    'settings.notifications': '알림',
    'settings.preferences': '환경설정',
    'settings.data': '데이터',

    // Print Network
    'print.search': '프린터 검색',
    'print.filter': '필터',
    'print.noResults': '프린터를 찾을 수 없습니다',
    'print.viewDetails': '세부 정보 보기',
    'print.requestQuote': '견적 요청',
    'print.loading': '로딩 중...',
    'print.printers': '프린터',
    'print.countries': '국가',
    
    // Categories
    'category.tshirt': 'T셔츠',
    'category.businesscard': '명함',
    'category.poster': '포스터',
    'category.canvas': '캔버스',
    'category.packaging': '포장',
    'category.promotional': '프로모션',
    'category.largeformat': '대형 형식',
    'category.3dprinting': '3D 인쇄',
  },
  
  ar: {
    // Navigation
    'nav.studio': 'ستوديو',
    'nav.marketplace': 'Alton فيد',
    'nav.community': 'المجتمع',
    'nav.designs': 'تصاميم Alton',
    'nav.print': 'طباعة',
    'nav.settings': 'الإعدادات',
    'nav.create': 'إنشاء',
    'nav.templates': 'القوالب',
    'nav.magic': 'Alton السحر',
    
    // Buttons
    'btn.save': 'حفظ',
    'btn.cancel': 'إلغاء',
    'btn.approve': 'موافقة',
    'btn.reject': 'رفض',
    'btn.update': 'تحديث',
    'btn.change': 'تغيير',
    'btn.logout': 'تسجيل الخروج',
    'btn.signin': 'تسجيل الدخول',
    
    // Account
    'account.email': 'بريد إلكتروني',
    'account.password': 'كلمة مرور جديدة',
    'account.language': 'اللغة',
    
    // Settings
    'settings.profile': 'الملف الشخصي',
    'settings.account': 'الحساب',
    'settings.security': 'الأمان',
    'settings.notifications': 'الإخطارات',
    'settings.preferences': 'التفضيلات',
    'settings.data': 'البيانات',

    // Print Network
    'print.search': 'البحث عن الطابعات',
    'print.filter': 'المرشحات',
    'print.noResults': 'لم يتم العثور على طابعات',
    'print.viewDetails': 'عرض التفاصيل',
    'print.requestQuote': 'طلب عرض أسعار',
    'print.loading': 'جاري التحميل...',
    'print.printers': 'الطابعات',
    'print.countries': 'الدول',
    
    // Categories
    'category.tshirt': 'قمصان',
    'category.businesscard': 'بطاقات العمل',
    'category.poster': 'ملصقات',
    'category.canvas': 'قماش',
    'category.packaging': 'التغليف',
    'category.promotional': 'ترويجي',
    'category.largeformat': 'تنسيق كبير',
    'category.3dprinting': 'طباعة ثلاثية الأبعاد',
  },
  
  hi: {
    // Navigation
    'nav.studio': 'स्टूडियो',
    'nav.marketplace': 'Alton फीड',
    'nav.community': 'समुदाय',
    'nav.designs': 'Alton डिजाइन',
    'nav.print': 'प्रिंट',
    'nav.settings': 'सेटिंग्स',
    'nav.create': 'बनाएं',
    'nav.templates': 'टेम्पलेट',
    'nav.magic': 'Alton जादू',
    
    // Buttons
    'btn.save': 'सहेजें',
    'btn.cancel': 'रद्द करें',
    'btn.approve': 'स्वीकृत करें',
    'btn.reject': 'अस्वीकार करें',
    'btn.update': 'अपडेट',
    'btn.change': 'बदलें',
    'btn.logout': 'लॉगआउट',
    'btn.signin': 'लॉगिन',
    
    // Account
    'account.email': 'ईमेल',
    'account.password': 'नया पासवर्ड',
    'account.language': 'भाषा',
    
    // Settings
    'settings.profile': 'प्रोफाइल',
    'settings.account': 'खाता',
    'settings.security': 'सुरक्षा',
    'settings.notifications': 'सूचनाएं',
    'settings.preferences': 'प्राथमिकताएं',
    'settings.data': 'डेटा',

    // Print Network
    'print.search': 'प्रिंटर खोजें',
    'print.filter': 'फ़िल्टर',
    'print.noResults': 'कोई प्रिंटर नहीं मिला',
    'print.viewDetails': 'विवरण देखें',
    'print.requestQuote': 'उद्धरण का अनुरोध करें',
    'print.loading': 'लोड हो रहा है...',
    'print.printers': 'प्रिंटर',
    'print.countries': 'देश',
    
    // Categories
    'category.tshirt': 'टी-शर्ट',
    'category.businesscard': 'व्यावसायिक कार्ड',
    'category.poster': 'पोस्टर',
    'category.canvas': 'कैनवास',
    'category.packaging': 'पैकेजिंग',
    'category.promotional': 'प्रचारणात्मक',
    'category.largeformat': 'बड़ा प्रारूप',
    'category.3dprinting': '3D प्रिंटिंग',
  },
};

/**
 * Get translation for a key in the specified language
 * Falls back to English if key not found
 */
export const t = (key: string, language: LanguageCode = 'en'): string => {
  if (translations[language] && translations[language][key]) {
    return translations[language][key];
  }
  // Fallback to English
  if (translations.en && translations.en[key]) {
    return translations.en[key];
  }
  // Return the key itself as last resort
  return key;
};

/**
 * Get current language from localStorage or user preference
 */
export const getCurrentLanguage = (): LanguageCode => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('preferred_language');
    if (stored && isValidLanguage(stored)) {
      return stored as LanguageCode;
    }
  }
  return 'en';
};

/**
 * Check if a language code is valid
 */
export const isValidLanguage = (code: string): boolean => {
  return code in translations;
};

/**
 * Set language preference and store it
 */
export const setLanguage = (language: LanguageCode): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred_language', language);
    // Dispatch event to notify the app
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
  }
};

/**
 * Get all available languages
 */
export const getAvailableLanguages = () => {
  return [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
    { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
    { code: 'de' as const, name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it' as const, name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt' as const, name: 'Português', flag: '🇵🇹' },
    { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
    { code: 'ja' as const, name: '日本語', flag: '🇯🇵' },
    { code: 'zh' as const, name: '中文', flag: '🇨🇳' },
    { code: 'ko' as const, name: '한국어', flag: '🇰🇷' },
    { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
    { code: 'hi' as const, name: 'हिन्दी', flag: '🇮🇳' },
  ];
};
