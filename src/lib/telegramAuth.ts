// Telegram WebApp-ის მონაცემების ამოღება - დებაგინგ ვერსია

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

// Mock user ტესტირებისთვის (როცა Telegram SDK არ არის)
const MOCK_USER: TelegramUser = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'test_user',
  photo_url: null,
  language_code: 'en',
};

export function getTelegramUser(): TelegramUser | null {
  console.log('🔍 ===== getTelegramUser() called =====');
  
  try {
    // Step 1: შევამოწმოთ window.Telegram
    console.log('🔍 Step 1: Checking window.Telegram...');
    console.log('🔍 window.Telegram exists?', !!(window as any).Telegram);
    
    const tg = (window as any).Telegram?.WebApp;
    
    console.log('🔍 Step 2: Telegram.WebApp exists?', !!tg);
    
    if (!tg) {
      console.warn('⚠️ Telegram WebApp not found!');
      console.warn('💡 Possible reasons:');
      console.warn('   1. App opened in browser (not Telegram)');
      console.warn('   2. telegram-web-app.js script not loaded');
      console.warn('   3. Script loading failed');
      console.log('🔍 Returning MOCK_USER for testing');
      return MOCK_USER;
    }

    // Step 3: Telegram WebApp არსებობს - ვნახოთ რა არის შიგნით
    console.log('✅ Step 3: Telegram WebApp found!');
    console.log('🔍 Telegram.WebApp object:', tg);
    
    // Step 4: შევამოწმოთ initData
    console.log('🔍 Step 4: Checking initData...');
    console.log('🔍 tg.initData:', tg.initData ? 'exists' : 'null/undefined');
    if (tg.initData) {
      console.log('🔍 tg.initData (first 100 chars):', tg.initData.substring(0, 100));
    }
    
    // Step 5: შევამოწმოთ initDataUnsafe
    console.log('🔍 Step 5: Checking initDataUnsafe...');
    console.log('🔍 tg.initDataUnsafe:', tg.initDataUnsafe);
    
    if (!tg.initDataUnsafe) {
      console.warn('⚠️ initDataUnsafe is null/undefined!');
      console.warn('💡 This means Telegram did not pass user data');
      console.warn('💡 Check BotFather settings:');
      console.warn('   - Menu Button URL is correct');
      console.warn('   - Bot is started (/start command)');
      console.log('🔍 Returning MOCK_USER for testing');
      return MOCK_USER;
    }
    
    // Step 6: შევამოწმოთ user
    console.log('🔍 Step 6: Checking initDataUnsafe.user...');
    const user = tg.initDataUnsafe?.user;
    
    console.log('🔍 user object:', user);
    
    if (!user) {
      console.warn('⚠️ User not found in initDataUnsafe!');
      console.warn('💡 This usually means:');
      console.warn('   1. Bot Menu Button not configured in BotFather');
      console.warn('   2. Web App opened directly (not via Menu Button)');
      console.warn('   3. User did not click /start on bot');
      console.log('🔍 Returning MOCK_USER for testing');
      return MOCK_USER;
    }
    
    // Step 7: User მოიძებნა!
    console.log('✅ Step 7: User found!');
    console.log('✅ Telegram user loaded:', user);
    console.log('🔍 User details:');
    console.log('   - ID:', user.id);
    console.log('   - First name:', user.first_name);
    console.log('   - Last name:', user.last_name || 'N/A');
    console.log('   - Username:', user.username || 'N/A');
    console.log('   - Language:', user.language_code || 'N/A');
    console.log('🔍 ===== getTelegramUser() SUCCESS =====');
    
    return user as TelegramUser;
    
  } catch (err) {
    console.error('❌ Exception in getTelegramUser:', err);
    console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack');
    console.log('🔍 Returning MOCK_USER due to error');
    return MOCK_USER;
  }
}

export function getTelegramWebApp() {
  try {
    const tg = (window as any).Telegram?.WebApp;
    console.log('🔍 getTelegramWebApp() called - WebApp exists?', !!tg);
    return tg;
  } catch (err) {
    console.error('❌ Error in getTelegramWebApp:', err);
    return null;
  }
}

// დამატებითი debug ფუნქცია - ყველა Telegram მონაცემის ნახვა
export function debugTelegramData() {
  console.log('🔍 ===== DEBUG TELEGRAM DATA =====');
  
  const tg = (window as any).Telegram?.WebApp;
  
  if (!tg) {
    console.log('❌ Telegram WebApp not available');
    return;
  }
  
  console.log('🔍 Telegram WebApp properties:');
  console.log('   - version:', tg.version);
  console.log('   - platform:', tg.platform);
  console.log('   - colorScheme:', tg.colorScheme);
  console.log('   - themeParams:', tg.themeParams);
  console.log('   - isExpanded:', tg.isExpanded);
  console.log('   - viewportHeight:', tg.viewportHeight);
  console.log('   - viewportStableHeight:', tg.viewportStableHeight);
  
  console.log('🔍 initData:', tg.initData);
  console.log('🔍 initDataUnsafe:', JSON.stringify(tg.initDataUnsafe, null, 2));
  
  console.log('🔍 ===== END DEBUG =====');
}

// Telegram-ის მონაცემებიდან Supabase user-ის ობიექტის შექმნა
export function createUserDataFromTelegram(tgUser: TelegramUser) {
  console.log('🔍 createUserDataFromTelegram called with:', tgUser);
  
  const userData = {
    telegram_id: tgUser.id,
    username: tgUser.username || null,
    display_name: tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''),
    avatar_url: tgUser.photo_url || null,
    bio: null,
    sun_sign: null,
    moon_sign: null,
    rising_sign: null,
    partner_sign: null,
    birth_date: null,
    birth_time: null,
    birth_place: null,
    level: 1,
    xp: 0,
    gems: 100,
    streak: 0,
    current_plan: 'FREE',
  };
  
  console.log('🔍 Created user data:', userData);
  return userData;
}