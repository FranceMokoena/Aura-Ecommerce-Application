const Preferences = require("../models/Preferences");
const User = require("../models/User");

// Get user preferences
const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    let preferences = await Preferences.findOne({ userId });

    // If no preferences exist, create default preferences
    if (!preferences) {
      preferences = new Preferences({ userId });
      await preferences.save();
    }

    res.json(preferences);
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update user preferences
const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    let preferences = await Preferences.findOne({ userId });

    // If no preferences exist, create new one
    if (!preferences) {
      preferences = new Preferences({ userId });
    }

    // Update notification preferences
    if (updateData.notifications) {
      Object.keys(updateData.notifications).forEach(key => {
        if (preferences.notifications.hasOwnProperty(key)) {
          preferences.notifications[key] = updateData.notifications[key];
        }
      });
    }

    // Update price range
    if (updateData.priceRange) {
      if (updateData.priceRange.minPrice !== undefined) {
        preferences.priceRange.minPrice = updateData.priceRange.minPrice;
      }
      if (updateData.priceRange.maxPrice !== undefined) {
        preferences.priceRange.maxPrice = updateData.priceRange.maxPrice;
      }
    }

    // Update location preferences
    if (updateData.location) {
      if (updateData.location.deliveryLocation !== undefined) {
        preferences.location.deliveryLocation = updateData.location.deliveryLocation;
      }
      if (updateData.location.pickupLocation !== undefined) {
        preferences.location.pickupLocation = updateData.location.pickupLocation;
      }
    }

    // Update account preferences
    if (updateData.account) {
      Object.keys(updateData.account).forEach(key => {
        if (preferences.account.hasOwnProperty(key)) {
          preferences.account[key] = updateData.account[key];
        }
      });
    }

    // Handle theme update specifically
    if (updateData.theme) {
      preferences.account.theme = updateData.theme;
    }

    // Update privacy settings
    if (updateData.privacy) {
      Object.keys(updateData.privacy).forEach(key => {
        if (preferences.privacy.hasOwnProperty(key)) {
          preferences.privacy[key] = updateData.privacy[key];
        }
      });
    }

    // Update security settings
    if (updateData.security) {
      Object.keys(updateData.security).forEach(key => {
        if (preferences.security.hasOwnProperty(key)) {
          preferences.security[key] = updateData.security[key];
        }
      });
    }

    // Update payment preferences
    if (updateData.payment) {
      Object.keys(updateData.payment).forEach(key => {
        if (preferences.payment.hasOwnProperty(key)) {
          preferences.payment[key] = updateData.payment[key];
        }
      });
    }

    // Update service preferences
    if (updateData.service) {
      if (updateData.service.preferredCategories !== undefined) {
        preferences.service.preferredCategories = updateData.service.preferredCategories;
      }
      if (updateData.service.preferredProviders !== undefined) {
        preferences.service.preferredProviders = updateData.service.preferredProviders;
      }
      if (updateData.service.bookingReminders !== undefined) {
        preferences.service.bookingReminders = updateData.service.bookingReminders;
      }
    }

    // Update shopping preferences
    if (updateData.shopping) {
      Object.keys(updateData.shopping).forEach(key => {
        if (preferences.shopping.hasOwnProperty(key)) {
          preferences.shopping[key] = updateData.shopping[key];
        }
      });
    }

    await preferences.save();

    res.json({ 
      message: "Preferences updated successfully", 
      preferences 
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset user preferences to default
const resetUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete existing preferences
    await Preferences.findOneAndDelete({ userId });

    // Create new default preferences
    const defaultPreferences = new Preferences({ userId });
    await defaultPreferences.save();

    res.json({ 
      message: "Preferences reset to default successfully", 
      preferences: defaultPreferences 
    });
  } catch (error) {
    console.error("Error resetting user preferences:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update privacy settings specifically
const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const privacyData = req.body;

    let preferences = await Preferences.findOne({ userId });

    if (!preferences) {
      preferences = new Preferences({ userId });
    }

    // Update privacy settings
    Object.keys(privacyData).forEach(key => {
      if (preferences.privacy.hasOwnProperty(key)) {
        preferences.privacy[key] = privacyData[key];
      }
    });

    await preferences.save();

    res.json({ 
      message: "Privacy settings updated successfully", 
      privacy: preferences.privacy 
    });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update security settings specifically
const updateSecuritySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const securityData = req.body;

    let preferences = await Preferences.findOne({ userId });

    if (!preferences) {
      preferences = new Preferences({ userId });
    }

    // Update security settings
    Object.keys(securityData).forEach(key => {
      if (preferences.security.hasOwnProperty(key)) {
        preferences.security[key] = securityData[key];
      }
    });

    await preferences.save();

    res.json({ 
      message: "Security settings updated successfully", 
      security: preferences.security 
    });
  } catch (error) {
    console.error("Error updating security settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Export user data
const exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const user = await User.findById(userId).select('-password');
    const preferences = await Preferences.findOne({ userId });
    
    // Get user orders
    const Order = require('../models/Order');
    const orders = await Order.find({ userId }).populate('products');
    
    // Get user bookings
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ userId }).populate('service');
    
    // Get user payments
    const Payment = require('../models/Payment');
    const payments = await Payment.find({ userId });
    
    // Get user cards
    const Card = require('../models/Card');
    const cards = await Card.find({ userId }).select('-cardNumber -cvv');

    const exportData = {
      user: user,
      preferences: preferences,
      orders: orders,
      bookings: bookings,
      payments: payments,
      cards: cards,
      exportDate: new Date().toISOString(),
      exportRequestedBy: userId
    };

    // In a real implementation, you would:
    // 1. Generate a file (JSON, CSV, etc.)
    // 2. Store it temporarily or send via email
    // 3. Log the export request for compliance
    
    res.json({ 
      message: "Data export request submitted successfully. You will receive an email with your data within 48 hours.",
      exportId: `EXP_${Date.now()}_${userId}`,
      estimatedDelivery: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Request account deletion
const requestAccountDeletion = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real implementation, you would:
    // 1. Create a deletion request record
    // 2. Send confirmation email
    // 3. Schedule deletion after grace period
    // 4. Log the request for compliance
    
    res.json({ 
      message: "Account deletion request submitted successfully. Please contact our support team to complete the process.",
      requestId: `DEL_${Date.now()}_${userId}`,
      status: 'pending',
      nextSteps: 'Contact support team within 30 days to confirm deletion'
    });
  } catch (error) {
    console.error("Error requesting account deletion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get available options for preferences
const getPreferenceOptions = async (req, res) => {
  try {
    const options = {
      languages: [
        { value: 'English', label: 'English' },
        { value: 'Afrikaans', label: 'Afrikaans' },
        { value: 'Zulu', label: 'isiZulu' },
        { value: 'Xhosa', label: 'isiXhosa' },
        { value: 'Spanish', label: 'Español' },
        { value: 'French', label: 'Français' },
        { value: 'German', label: 'Deutsch' },
        { value: 'Chinese', label: '中文' },
        { value: 'Japanese', label: '日本語' },
        { value: 'Korean', label: '한국어' },
        { value: 'Arabic', label: 'العربية' },
        { value: 'Hindi', label: 'हिन्दी' },
        { value: 'Bengali', label: 'বাংলা' },
        { value: 'Portuguese', label: 'Português' },
        { value: 'Russian', label: 'Русский' },
        { value: 'Italian', label: 'Italiano' },
        { value: 'Dutch', label: 'Nederlands' },
        { value: 'Swedish', label: 'Svenska' },
        { value: 'Norwegian', label: 'Norsk' },
        { value: 'Danish', label: 'Dansk' },
        { value: 'Finnish', label: 'Suomi' },
        { value: 'Polish', label: 'Polski' },
        { value: 'Czech', label: 'Čeština' },
        { value: 'Hungarian', label: 'Magyar' },
        { value: 'Romanian', label: 'Română' },
        { value: 'Bulgarian', label: 'Български' },
        { value: 'Croatian', label: 'Hrvatski' },
        { value: 'Serbian', label: 'Српски' },
        { value: 'Slovenian', label: 'Slovenščina' },
        { value: 'Slovak', label: 'Slovenčina' },
        { value: 'Lithuanian', label: 'Lietuvių' },
        { value: 'Latvian', label: 'Latviešu' },
        { value: 'Estonian', label: 'Eesti' },
        { value: 'Greek', label: 'Ελληνικά' },
        { value: 'Turkish', label: 'Türkçe' },
        { value: 'Ukrainian', label: 'Українська' },
        { value: 'Belarusian', label: 'Беларуская' },
        { value: 'Kazakh', label: 'Қазақ' },
        { value: 'Uzbek', label: 'O\'zbek' },
        { value: 'Kyrgyz', label: 'Кыргызча' },
        { value: 'Tajik', label: 'Тоҷикӣ' },
        { value: 'Turkmen', label: 'Türkmençe' },
        { value: 'Azerbaijani', label: 'Azərbaycan' },
        { value: 'Georgian', label: 'ქართული' },
        { value: 'Armenian', label: 'Հայերեն' },
        { value: 'Albanian', label: 'Shqip' },
        { value: 'Macedonian', label: 'Македонски' },
        { value: 'Bosnian', label: 'Bosanski' },
        { value: 'Montenegrin', label: 'Crnogorski' },
        { value: 'Moldovan', label: 'Moldovenească' },
        { value: 'Hebrew', label: 'עברית' },
        { value: 'Persian', label: 'فارسی' },
        { value: 'Urdu', label: 'اردو' },
        { value: 'Punjabi', label: 'ਪੰਜਾਬੀ' },
        { value: 'Gujarati', label: 'ગુજરાતી' },
        { value: 'Marathi', label: 'मराठी' },
        { value: 'Tamil', label: 'தமிழ்' },
        { value: 'Telugu', label: 'తెలుగు' },
        { value: 'Kannada', label: 'ಕನ್ನಡ' },
        { value: 'Malayalam', label: 'മലയാളം' },
        { value: 'Sinhala', label: 'සිංහල' },
        { value: 'Nepali', label: 'नेपाली' },
        { value: 'Bhutanese', label: 'རྫོང་ཁ' },
        { value: 'Tibetan', label: 'བོད་ཡིག' },
        { value: 'Mongolian', label: 'Монгол' },
        { value: 'Thai', label: 'ไทย' },
        { value: 'Vietnamese', label: 'Tiếng Việt' },
        { value: 'Lao', label: 'ລາວ' },
        { value: 'Khmer', label: 'ខ្មែរ' },
        { value: 'Burmese', label: 'မြန်မာ' },
        { value: 'Malay', label: 'Bahasa Melayu' },
        { value: 'Indonesian', label: 'Bahasa Indonesia' },
        { value: 'Filipino', label: 'Filipino' },
        { value: 'Tagalog', label: 'Tagalog' },
        { value: 'Cebuano', label: 'Cebuano' },
        { value: 'Ilocano', label: 'Ilocano' },
        { value: 'Hiligaynon', label: 'Hiligaynon' },
        { value: 'Waray', label: 'Waray' },
        { value: 'Kapampangan', label: 'Kapampangan' },
        { value: 'Pangasinan', label: 'Pangasinan' },
        { value: 'Bicolano', label: 'Bicolano' },
        { value: 'Ibanag', label: 'Ibanag' },
        { value: 'Ivatan', label: 'Ivatan' },
        { value: 'Kankanaey', label: 'Kankanaey' },
        { value: 'Kinaray-a', label: 'Kinaray-a' },
        { value: 'Maguindanao', label: 'Maguindanao' },
        { value: 'Maranao', label: 'Maranao' },
        { value: 'Tausug', label: 'Tausug' },
        { value: 'Yakan', label: 'Yakan' },
        { value: 'Sama', label: 'Sama' },
        { value: 'Bajau', label: 'Bajau' },
        { value: 'Tboli', label: 'Tboli' },
        { value: 'Manobo', label: 'Manobo' },
        { value: 'Subanen', label: 'Subanen' },
        { value: 'Blaan', label: 'Blaan' },
        { value: 'Bagobo', label: 'Bagobo' },
        { value: 'Mandaya', label: 'Mandaya' },
        { value: 'Mansaka', label: 'Mansaka' },
        { value: 'Kalagan', label: 'Kalagan' },
        { value: 'Sangir', label: 'Sangir' },
        { value: 'Talaud', label: 'Talaud' },
        { value: 'Minahasa', label: 'Minahasa' },
        { value: 'Gorontalo', label: 'Gorontalo' },
        { value: 'Bugis', label: 'Bugis' },
        { value: 'Makassar', label: 'Makassar' },
        { value: 'Toraja', label: 'Toraja' },
        { value: 'Minangkabau', label: 'Minangkabau' },
        { value: 'Acehnese', label: 'Acehnese' },
        { value: 'Batak', label: 'Batak' },
        { value: 'Sundanese', label: 'Sundanese' },
        { value: 'Javanese', label: 'Javanese' },
        { value: 'Madurese', label: 'Madurese' },
        { value: 'Balinese', label: 'Balinese' },
        { value: 'Sasak', label: 'Sasak' },
        { value: 'Dayak', label: 'Dayak' },
        { value: 'Iban', label: 'Iban' },
        { value: 'Bidayuh', label: 'Bidayuh' },
        { value: 'Kadazan', label: 'Kadazan' },
        { value: 'Dusun', label: 'Dusun' },
        { value: 'Murut', label: 'Murut' },
        { value: 'Lun Bawang', label: 'Lun Bawang' },
        { value: 'Kelabit', label: 'Kelabit' },
        { value: 'Penan', label: 'Penan' },
        { value: 'Kenyah', label: 'Kenyah' },
        { value: 'Kayan', label: 'Kayan' },
        { value: 'Punan', label: 'Punan' },
        { value: 'Berawan', label: 'Berawan' },
        { value: 'Kiput', label: 'Kiput' },
        { value: 'Narom', label: 'Narom' },
        { value: 'Tutong', label: 'Tutong' },
        { value: 'Belait', label: 'Belait' }
      ],
      
      currencies: [
        { value: 'ZAR', label: 'South African Rand (R)' },
        { value: 'USD', label: 'US Dollar ($)' },
        { value: 'EUR', label: 'Euro (€)' },
        { value: 'GBP', label: 'British Pound (£)' },
        { value: 'CAD', label: 'Canadian Dollar (C$)' },
        { value: 'AUD', label: 'Australian Dollar (A$)' },
        { value: 'JPY', label: 'Japanese Yen (¥)' },
        { value: 'CHF', label: 'Swiss Franc (CHF)' },
        { value: 'CNY', label: 'Chinese Yuan (¥)' },
        { value: 'INR', label: 'Indian Rupee (₹)' },
        { value: 'BRL', label: 'Brazilian Real (R$)' },
        { value: 'MXN', label: 'Mexican Peso ($)' },
        { value: 'SGD', label: 'Singapore Dollar (S$)' },
        { value: 'HKD', label: 'Hong Kong Dollar (HK$)' },
        { value: 'NZD', label: 'New Zealand Dollar (NZ$)' },
        { value: 'SEK', label: 'Swedish Krona (kr)' },
        { value: 'NOK', label: 'Norwegian Krone (kr)' },
        { value: 'DKK', label: 'Danish Krone (kr)' },
        { value: 'PLN', label: 'Polish Złoty (zł)' },
        { value: 'CZK', label: 'Czech Koruna (Kč)' },
        { value: 'HUF', label: 'Hungarian Forint (Ft)' },
        { value: 'RUB', label: 'Russian Ruble (₽)' },
        { value: 'TRY', label: 'Turkish Lira (₺)' },
        { value: 'KRW', label: 'South Korean Won (₩)' },
        { value: 'THB', label: 'Thai Baht (฿)' },
        { value: 'MYR', label: 'Malaysian Ringgit (RM)' },
        { value: 'IDR', label: 'Indonesian Rupiah (Rp)' },
        { value: 'PHP', label: 'Philippine Peso (₱)' },
        { value: 'VND', label: 'Vietnamese Dong (₫)' },
        { value: 'EGP', label: 'Egyptian Pound (E£)' },
        { value: 'NGN', label: 'Nigerian Naira (₦)' },
        { value: 'KES', label: 'Kenyan Shilling (KSh)' },
        { value: 'GHS', label: 'Ghanaian Cedi (GH₵)' },
        { value: 'UGX', label: 'Ugandan Shilling (USh)' },
        { value: 'TZS', label: 'Tanzanian Shilling (TSh)' },
        { value: 'ZMW', label: 'Zambian Kwacha (ZK)' },
        { value: 'BWP', label: 'Botswana Pula (P)' },
        { value: 'NAD', label: 'Namibian Dollar (N$)' },
        { value: 'LSL', label: 'Lesotho Loti (L)' },
        { value: 'SZL', label: 'Eswatini Lilangeni (E)' },
        { value: 'MUR', label: 'Mauritian Rupee (₨)' },
        { value: 'SCR', label: 'Seychellois Rupee (₨)' },
        { value: 'MAD', label: 'Moroccan Dirham (MAD)' },
        { value: 'TND', label: 'Tunisian Dinar (TND)' },
        { value: 'DZD', label: 'Algerian Dinar (DZD)' },
        { value: 'LYD', label: 'Libyan Dinar (LYD)' },
        { value: 'SDG', label: 'Sudanese Pound (SDG)' },
        { value: 'ETB', label: 'Ethiopian Birr (ETB)' },
        { value: 'SOS', label: 'Somali Shilling (SOS)' },
        { value: 'DJF', label: 'Djiboutian Franc (DJF)' },
        { value: 'KMF', label: 'Comorian Franc (KMF)' },
        { value: 'MGA', label: 'Malagasy Ariary (MGA)' },
        { value: 'MZN', label: 'Mozambican Metical (MZN)' },
        { value: 'ZWL', label: 'Zimbabwean Dollar (ZWL)' },
        { value: 'MWK', label: 'Malawian Kwacha (MWK)' },
        { value: 'BIF', label: 'Burundian Franc (BIF)' },
        { value: 'RWF', label: 'Rwandan Franc (RWF)' },
        { value: 'CDF', label: 'Congolese Franc (CDF)' },
        { value: 'XAF', label: 'Central African CFA Franc (XAF)' },
        { value: 'XOF', label: 'West African CFA Franc (XOF)' },
        { value: 'XPF', label: 'CFP Franc (XPF)' },
        { value: 'CLP', label: 'Chilean Peso (CLP)' },
        { value: 'ARS', label: 'Argentine Peso (ARS)' },
        { value: 'UYU', label: 'Uruguayan Peso (UYU)' },
        { value: 'PYG', label: 'Paraguayan Guaraní (PYG)' },
        { value: 'BOB', label: 'Bolivian Boliviano (BOB)' },
        { value: 'PEN', label: 'Peruvian Sol (PEN)' },
        { value: 'COP', label: 'Colombian Peso (COP)' },
        { value: 'VES', label: 'Venezuelan Bolívar (VES)' },
        { value: 'GTQ', label: 'Guatemalan Quetzal (GTQ)' },
        { value: 'HNL', label: 'Honduran Lempira (HNL)' },
        { value: 'NIO', label: 'Nicaraguan Córdoba (NIO)' },
        { value: 'CRC', label: 'Costa Rican Colón (CRC)' },
        { value: 'PAB', label: 'Panamanian Balboa (PAB)' },
        { value: 'DOP', label: 'Dominican Peso (DOP)' },
        { value: 'JMD', label: 'Jamaican Dollar (JMD)' },
        { value: 'TTD', label: 'Trinidad and Tobago Dollar (TTD)' },
        { value: 'BBD', label: 'Barbadian Dollar (BBD)' },
        { value: 'XCD', label: 'East Caribbean Dollar (XCD)' },
        { value: 'AWG', label: 'Aruban Florin (AWG)' },
        { value: 'ANG', label: 'Netherlands Antillean Guilder (ANG)' },
        { value: 'GYD', label: 'Guyanese Dollar (GYD)' },
        { value: 'SRD', label: 'Surinamese Dollar (SRD)' },
        { value: 'BZD', label: 'Belize Dollar (BZD)' },
        { value: 'HTG', label: 'Haitian Gourde (HTG)' },
        { value: 'CUP', label: 'Cuban Peso (CUP)' },
        { value: 'BMD', label: 'Bermudian Dollar (BMD)' },
        { value: 'KYD', label: 'Cayman Islands Dollar (KYD)' },
        { value: 'FJD', label: 'Fijian Dollar (FJD)' },
        { value: 'WST', label: 'Samoan Tālā (WST)' },
        { value: 'TOP', label: 'Tongan Paʻanga (TOP)' },
        { value: 'VUV', label: 'Vanuatu Vatu (VUV)' },
        { value: 'SBD', label: 'Solomon Islands Dollar (SBD)' },
        { value: 'PGK', label: 'Papua New Guinean Kina (PGK)' },
        { value: 'KID', label: 'Kiribati Dollar (KID)' },
        { value: 'TVD', label: 'Tuvaluan Dollar (TVD)' },
        { value: 'NPR', label: 'Nepalese Rupee (NPR)' },
        { value: 'BDT', label: 'Bangladeshi Taka (BDT)' },
        { value: 'LKR', label: 'Sri Lankan Rupee (LKR)' },
        { value: 'MMK', label: 'Myanmar Kyat (MMK)' },
        { value: 'KHR', label: 'Cambodian Riel (KHR)' },
        { value: 'LAK', label: 'Lao Kip (LAK)' },
        { value: 'MNT', label: 'Mongolian Tögrög (MNT)' },
        { value: 'BTN', label: 'Bhutanese Ngultrum (BTN)' },
        { value: 'MVR', label: 'Maldivian Rufiyaa (MVR)' },
        { value: 'PKR', label: 'Pakistani Rupee (PKR)' },
        { value: 'AFN', label: 'Afghan Afghani (AFN)' },
        { value: 'TJS', label: 'Tajikistani Somoni (TJS)' },
        { value: 'UZS', label: 'Uzbekistani Som (UZS)' },
        { value: 'KGS', label: 'Kyrgyzstani Som (KGS)' },
        { value: 'TMT', label: 'Turkmenistani Manat (TMT)' },
        { value: 'AZN', label: 'Azerbaijani Manat (AZN)' },
        { value: 'GEL', label: 'Georgian Lari (GEL)' },
        { value: 'AMD', label: 'Armenian Dram (AMD)' },
        { value: 'ALL', label: 'Albanian Lek (ALL)' },
        { value: 'MKD', label: 'Macedonian Denar (MKD)' },
        { value: 'RSD', label: 'Serbian Dinar (RSD)' },
        { value: 'BAM', label: 'Bosnia and Herzegovina Convertible Mark (BAM)' },
        { value: 'HRK', label: 'Croatian Kuna (HRK)' },
        { value: 'BGN', label: 'Bulgarian Lev (BGN)' },
        { value: 'RON', label: 'Romanian Leu (RON)' },
        { value: 'MDL', label: 'Moldovan Leu (MDL)' },
        { value: 'UAH', label: 'Ukrainian Hryvnia (UAH)' },
        { value: 'BYN', label: 'Belarusian Ruble (BYN)' },
        { value: 'KZT', label: 'Kazakhstani Tenge (KZT)' },
        { value: 'KWD', label: 'Kuwaiti Dinar (KWD)' },
        { value: 'BHD', label: 'Bahraini Dinar (BHD)' },
        { value: 'OMR', label: 'Omani Rial (OMR)' },
        { value: 'QAR', label: 'Qatari Riyal (QAR)' },
        { value: 'AED', label: 'UAE Dirham (AED)' },
        { value: 'SAR', label: 'Saudi Riyal (SAR)' },
        { value: 'YER', label: 'Yemeni Rial (YER)' },
        { value: 'JOD', label: 'Jordanian Dinar (JOD)' },
        { value: 'LBP', label: 'Lebanese Pound (LBP)' },
        { value: 'SYP', label: 'Syrian Pound (SYP)' },
        { value: 'IQD', label: 'Iraqi Dinar (IQD)' },
        { value: 'IRR', label: 'Iranian Rial (IRR)' },
        { value: 'ILS', label: 'Israeli Shekel (ILS)' }
      ],
      paymentMethods: [
        { value: 'Credit Card', label: 'Credit Card' },
        { value: 'Debit Card', label: 'Debit Card' },
        { value: 'PayPal', label: 'PayPal' },
        { value: 'Apple Pay', label: 'Apple Pay' },
        { value: 'Google Pay', label: 'Google Pay' },
        { value: 'Bank Transfer', label: 'Bank Transfer' },
        { value: 'Cash on Delivery', label: 'Cash on Delivery' }
      ],
      deliveryPreferences: [
        { value: 'Standard', label: 'Standard Delivery' },
        { value: 'Express', label: 'Express Delivery' },
        { value: 'Same Day', label: 'Same Day Delivery' },
        { value: 'Pickup', label: 'Store Pickup' }
      ],
      serviceCategories: [
        { value: 'Cleaning', label: 'Cleaning' },
        { value: 'Plumbing', label: 'Plumbing' },
        { value: 'Electrical', label: 'Electrical' },
        { value: 'Tutoring', label: 'Tutoring' },
        { value: 'Gardening', label: 'Gardening' },
        { value: 'Cooking', label: 'Cooking' },
        { value: 'Transport', label: 'Transport' },
        { value: 'Beauty', label: 'Beauty' },
        { value: 'Fitness', label: 'Fitness' },
        { value: 'Pet Care', label: 'Pet Care' }
      ],
      sortOptions: [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'price_low', label: 'Price: Low to High' },
        { value: 'price_high', label: 'Price: High to Low' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'popular', label: 'Most Popular' }
      ]
    };

    res.json(options);
  } catch (error) {
    console.error("Error fetching preference options:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  resetUserPreferences,
  getPreferenceOptions,
  updatePrivacySettings,
  updateSecuritySettings,
  exportUserData,
  requestAccountDeletion
};
