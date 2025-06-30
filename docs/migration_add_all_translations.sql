-- Migration: Add translations for all supported languages to existing vocabulary

-- First, ensure we have the supported languages table
CREATE TABLE IF NOT EXISTS supported_languages (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    native_name TEXT NOT NULL,
    flag_emoji TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all supported languages with their details
INSERT INTO supported_languages (code, name, native_name, flag_emoji) VALUES
('en', 'English', 'English', '🇬🇧'),
('es', 'Spanish', 'Español', '🇪🇸'),
('fr', 'French', 'Français', '🇫🇷'),
('de', 'German', 'Deutsch', '🇩🇪'),
('it', 'Italian', 'Italiano', '🇮🇹'),
('pt', 'Portuguese', 'Português', '🇵🇹'),
('ja', 'Japanese', '日本語', '🇯🇵'),
('ko', 'Korean', '한국어', '🇰🇷'),
('zh', 'Chinese', '中文', '🇨🇳')
ON CONFLICT (code) DO UPDATE SET
    flag_emoji = EXCLUDED.flag_emoji,
    is_active = true;

-- Create a temporary table with all translations
CREATE TEMP TABLE vocabulary_translations_temp (
    word TEXT,
    language_code TEXT,
    translation TEXT,
    PRIMARY KEY (word, language_code)
);

-- Insert translations for all existing vocabulary words
-- Nature & Outdoors
INSERT INTO vocabulary_translations_temp (word, language_code, translation) VALUES
-- tree
('tree', 'es', 'árbol'),
('tree', 'fr', 'arbre'),
('tree', 'de', 'Baum'),
('tree', 'it', 'albero'),
('tree', 'pt', 'árvore'),
('tree', 'ja', '木'),
('tree', 'ko', '나무'),
('tree', 'zh', '树'),
-- flower
('flower', 'es', 'flor'),
('flower', 'fr', 'fleur'),
('flower', 'de', 'Blume'),
('flower', 'it', 'fiore'),
('flower', 'pt', 'flor'),
('flower', 'ja', '花'),
('flower', 'ko', '꽃'),
('flower', 'zh', '花'),
-- sun
('sun', 'es', 'sol'),
('sun', 'fr', 'soleil'),
('sun', 'de', 'Sonne'),
('sun', 'it', 'sole'),
('sun', 'pt', 'sol'),
('sun', 'ja', '太陽'),
('sun', 'ko', '태양'),
('sun', 'zh', '太阳'),
-- moon
('moon', 'es', 'luna'),
('moon', 'fr', 'lune'),
('moon', 'de', 'Mond'),
('moon', 'it', 'luna'),
('moon', 'pt', 'lua'),
('moon', 'ja', '月'),
('moon', 'ko', '달'),
('moon', 'zh', '月亮'),
-- star
('star', 'es', 'estrella'),
('star', 'fr', 'étoile'),
('star', 'de', 'Stern'),
('star', 'it', 'stella'),
('star', 'pt', 'estrela'),
('star', 'ja', '星'),
('star', 'ko', '별'),
('star', 'zh', '星星'),
-- water
('water', 'es', 'agua'),
('water', 'fr', 'eau'),
('water', 'de', 'Wasser'),
('water', 'it', 'acqua'),
('water', 'pt', 'água'),
('water', 'ja', '水'),
('water', 'ko', '물'),
('water', 'zh', '水'),
-- stone
('stone', 'es', 'piedra'),
('stone', 'fr', 'pierre'),
('stone', 'de', 'Stein'),
('stone', 'it', 'pietra'),
('stone', 'pt', 'pedra'),
('stone', 'ja', '石'),
('stone', 'ko', '돌'),
('stone', 'zh', '石头'),
-- sky
('sky', 'es', 'cielo'),
('sky', 'fr', 'ciel'),
('sky', 'de', 'Himmel'),
('sky', 'it', 'cielo'),
('sky', 'pt', 'céu'),
('sky', 'ja', '空'),
('sky', 'ko', '하늘'),
('sky', 'zh', '天空'),

-- Urban & City Life
-- house
('house', 'es', 'casa'),
('house', 'fr', 'maison'),
('house', 'de', 'Haus'),
('house', 'it', 'casa'),
('house', 'pt', 'casa'),
('house', 'ja', '家'),
('house', 'ko', '집'),
('house', 'zh', '房子'),
-- door
('door', 'es', 'puerta'),
('door', 'fr', 'porte'),
('door', 'de', 'Tür'),
('door', 'it', 'porta'),
('door', 'pt', 'porta'),
('door', 'ja', 'ドア'),
('door', 'ko', '문'),
('door', 'zh', '门'),
-- window
('window', 'es', 'ventana'),
('window', 'fr', 'fenêtre'),
('window', 'de', 'Fenster'),
('window', 'it', 'finestra'),
('window', 'pt', 'janela'),
('window', 'ja', '窓'),
('window', 'ko', '창문'),
('window', 'zh', '窗户'),
-- street
('street', 'es', 'calle'),
('street', 'fr', 'rue'),
('street', 'de', 'Straße'),
('street', 'it', 'strada'),
('street', 'pt', 'rua'),
('street', 'ja', '通り'),
('street', 'ko', '거리'),
('street', 'zh', '街道'),
-- car
('car', 'es', 'coche'),
('car', 'fr', 'voiture'),
('car', 'de', 'Auto'),
('car', 'it', 'auto'),
('car', 'pt', 'carro'),
('car', 'ja', '車'),
('car', 'ko', '자동차'),
('car', 'zh', '汽车'),
-- bus
('bus', 'es', 'autobús'),
('bus', 'fr', 'bus'),
('bus', 'de', 'Bus'),
('bus', 'it', 'autobus'),
('bus', 'pt', 'ônibus'),
('bus', 'ja', 'バス'),
('bus', 'ko', '버스'),
('bus', 'zh', '公共汽车'),
-- bicycle
('bicycle', 'es', 'bicicleta'),
('bicycle', 'fr', 'vélo'),
('bicycle', 'de', 'Fahrrad'),
('bicycle', 'it', 'bicicletta'),
('bicycle', 'pt', 'bicicleta'),
('bicycle', 'ja', '自転車'),
('bicycle', 'ko', '자전거'),
('bicycle', 'zh', '自行车'),
-- bridge
('bridge', 'es', 'puente'),
('bridge', 'fr', 'pont'),
('bridge', 'de', 'Brücke'),
('bridge', 'it', 'ponte'),
('bridge', 'pt', 'ponte'),
('bridge', 'ja', '橋'),
('bridge', 'ko', '다리'),
('bridge', 'zh', '桥'),
-- sign
('sign', 'es', 'letrero'),
('sign', 'fr', 'panneau'),
('sign', 'de', 'Schild'),
('sign', 'it', 'cartello'),
('sign', 'pt', 'placa'),
('sign', 'ja', '標識'),
('sign', 'ko', '표지판'),
('sign', 'zh', '标志'),
-- chair
('chair', 'es', 'silla'),
('chair', 'fr', 'chaise'),
('chair', 'de', 'Stuhl'),
('chair', 'it', 'sedia'),
('chair', 'pt', 'cadeira'),
('chair', 'ja', '椅子'),
('chair', 'ko', '의자'),
('chair', 'zh', '椅子'),
-- table
('table', 'es', 'mesa'),
('table', 'fr', 'table'),
('table', 'de', 'Tisch'),
('table', 'it', 'tavolo'),
('table', 'pt', 'mesa'),
('table', 'ja', 'テーブル'),
('table', 'ko', '테이블'),
('table', 'zh', '桌子'),

-- Food & Drink
-- apple
('apple', 'es', 'manzana'),
('apple', 'fr', 'pomme'),
('apple', 'de', 'Apfel'),
('apple', 'it', 'mela'),
('apple', 'pt', 'maçã'),
('apple', 'ja', 'りんご'),
('apple', 'ko', '사과'),
('apple', 'zh', '苹果'),
-- banana
('banana', 'es', 'plátano'),
('banana', 'fr', 'banane'),
('banana', 'de', 'Banane'),
('banana', 'it', 'banana'),
('banana', 'pt', 'banana'),
('banana', 'ja', 'バナナ'),
('banana', 'ko', '바나나'),
('banana', 'zh', '香蕉'),
-- bread
('bread', 'es', 'pan'),
('bread', 'fr', 'pain'),
('bread', 'de', 'Brot'),
('bread', 'it', 'pane'),
('bread', 'pt', 'pão'),
('bread', 'ja', 'パン'),
('bread', 'ko', '빵'),
('bread', 'zh', '面包'),
-- coffee
('coffee', 'es', 'café'),
('coffee', 'fr', 'café'),
('coffee', 'de', 'Kaffee'),
('coffee', 'it', 'caffè'),
('coffee', 'pt', 'café'),
('coffee', 'ja', 'コーヒー'),
('coffee', 'ko', '커피'),
('coffee', 'zh', '咖啡'),
-- tea
('tea', 'es', 'té'),
('tea', 'fr', 'thé'),
('tea', 'de', 'Tee'),
('tea', 'it', 'tè'),
('tea', 'pt', 'chá'),
('tea', 'ja', 'お茶'),
('tea', 'ko', '차'),
('tea', 'zh', '茶'),
-- cup
('cup', 'es', 'taza'),
('cup', 'fr', 'tasse'),
('cup', 'de', 'Tasse'),
('cup', 'it', 'tazza'),
('cup', 'pt', 'xícara'),
('cup', 'ja', 'カップ'),
('cup', 'ko', '컵'),
('cup', 'zh', '杯子'),
-- plate
('plate', 'es', 'plato'),
('plate', 'fr', 'assiette'),
('plate', 'de', 'Teller'),
('plate', 'it', 'piatto'),
('plate', 'pt', 'prato'),
('plate', 'ja', '皿'),
('plate', 'ko', '접시'),
('plate', 'zh', '盘子'),

-- Home & Everyday Objects
-- book
('book', 'es', 'libro'),
('book', 'fr', 'livre'),
('book', 'de', 'Buch'),
('book', 'it', 'libro'),
('book', 'pt', 'livro'),
('book', 'ja', '本'),
('book', 'ko', '책'),
('book', 'zh', '书'),
-- pen
('pen', 'es', 'bolígrafo'),
('pen', 'fr', 'stylo'),
('pen', 'de', 'Stift'),
('pen', 'it', 'penna'),
('pen', 'pt', 'caneta'),
('pen', 'ja', 'ペン'),
('pen', 'ko', '펜'),
('pen', 'zh', '笔'),
-- key
('key', 'es', 'llave'),
('key', 'fr', 'clé'),
('key', 'de', 'Schlüssel'),
('key', 'it', 'chiave'),
('key', 'pt', 'chave'),
('key', 'ja', '鍵'),
('key', 'ko', '열쇠'),
('key', 'zh', '钥匙'),
-- phone
('phone', 'es', 'teléfono'),
('phone', 'fr', 'téléphone'),
('phone', 'de', 'Telefon'),
('phone', 'it', 'telefono'),
('phone', 'pt', 'telefone'),
('phone', 'ja', '電話'),
('phone', 'ko', '전화'),
('phone', 'zh', '电话'),
-- computer
('computer', 'es', 'computadora'),
('computer', 'fr', 'ordinateur'),
('computer', 'de', 'Computer'),
('computer', 'it', 'computer'),
('computer', 'pt', 'computador'),
('computer', 'ja', 'コンピューター'),
('computer', 'ko', '컴퓨터'),
('computer', 'zh', '电脑'),
-- watch
('watch', 'es', 'reloj'),
('watch', 'fr', 'montre'),
('watch', 'de', 'Uhr'),
('watch', 'it', 'orologio'),
('watch', 'pt', 'relógio'),
('watch', 'ja', '時計'),
('watch', 'ko', '시계'),
('watch', 'zh', '手表'),
-- bed
('bed', 'es', 'cama'),
('bed', 'fr', 'lit'),
('bed', 'de', 'Bett'),
('bed', 'it', 'letto'),
('bed', 'pt', 'cama'),
('bed', 'ja', 'ベッド'),
('bed', 'ko', '침대'),
('bed', 'zh', '床'),
-- lamp
('lamp', 'es', 'lámpara'),
('lamp', 'fr', 'lampe'),
('lamp', 'de', 'Lampe'),
('lamp', 'it', 'lampada'),
('lamp', 'pt', 'lâmpada'),
('lamp', 'ja', 'ランプ'),
('lamp', 'ko', '램프'),
('lamp', 'zh', '灯'),
-- money
('money', 'es', 'dinero'),
('money', 'fr', 'argent'),
('money', 'de', 'Geld'),
('money', 'it', 'denaro'),
('money', 'pt', 'dinheiro'),
('money', 'ja', 'お金'),
('money', 'ko', '돈'),
('money', 'zh', '钱'),

-- Travel
-- ticket
('ticket', 'es', 'boleto'),
('ticket', 'fr', 'billet'),
('ticket', 'de', 'Ticket'),
('ticket', 'it', 'biglietto'),
('ticket', 'pt', 'bilhete'),
('ticket', 'ja', 'チケット'),
('ticket', 'ko', '티켓'),
('ticket', 'zh', '票'),
-- train
('train', 'es', 'tren'),
('train', 'fr', 'train'),
('train', 'de', 'Zug'),
('train', 'it', 'treno'),
('train', 'pt', 'trem'),
('train', 'ja', '電車'),
('train', 'ko', '기차'),
('train', 'zh', '火车'),
-- airplane
('airplane', 'es', 'avión'),
('airplane', 'fr', 'avion'),
('airplane', 'de', 'Flugzeug'),
('airplane', 'it', 'aereo'),
('airplane', 'pt', 'avião'),
('airplane', 'ja', '飛行機'),
('airplane', 'ko', '비행기'),
('airplane', 'zh', '飞机'),
-- boat
('boat', 'es', 'barco'),
('boat', 'fr', 'bateau'),
('boat', 'de', 'Boot'),
('boat', 'it', 'barca'),
('boat', 'pt', 'barco'),
('boat', 'ja', 'ボート'),
('boat', 'ko', '보트'),
('boat', 'zh', '船');

-- Update the master_vocabulary table to store all translations as JSONB
ALTER TABLE master_vocabulary 
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';

-- Update existing vocabulary with all translations
UPDATE master_vocabulary mv
SET translations = (
    SELECT jsonb_object_agg(vt.language_code, vt.translation)
    FROM vocabulary_translations_temp vt
    WHERE vt.word = mv.word
)
WHERE EXISTS (
    SELECT 1 FROM vocabulary_translations_temp vt WHERE vt.word = mv.word
);

-- Add a function to get translation for a specific language
CREATE OR REPLACE FUNCTION get_translation(vocabulary_row master_vocabulary, target_language TEXT)
RETURNS TEXT AS $$
BEGIN
    -- If translations JSONB has the language, return it
    IF vocabulary_row.translations ? target_language THEN
        RETURN vocabulary_row.translations ->> target_language;
    -- Otherwise, return the old translation column (Spanish) as fallback
    ELSIF vocabulary_row.translation IS NOT NULL THEN
        RETURN vocabulary_row.translation;
    -- Last resort, return the word itself
    ELSE
        RETURN vocabulary_row.word;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a view that makes it easy to get vocabulary with specific language translation
CREATE OR REPLACE VIEW vocabulary_for_language AS
SELECT 
    mv.*,
    get_translation(mv, current_setting('app.current_language', true)) as current_translation
FROM master_vocabulary mv;

-- Grant permissions
GRANT SELECT ON vocabulary_for_language TO authenticated, anon;

-- Add some new technology vocabulary with all translations
INSERT INTO master_vocabulary (word, language, category, difficulty, rarity, translations) VALUES
('laptop', 'en', 'technology', 2, 'common', '{
    "es": "portátil",
    "fr": "ordinateur portable",
    "de": "Laptop",
    "it": "portatile",
    "pt": "laptop",
    "ja": "ノートパソコン",
    "ko": "노트북",
    "zh": "笔记本电脑"
}'::jsonb),
('keyboard', 'en', 'technology', 1, 'common', '{
    "es": "teclado",
    "fr": "clavier",
    "de": "Tastatur",
    "it": "tastiera",
    "pt": "teclado",
    "ja": "キーボード",
    "ko": "키보드",
    "zh": "键盘"
}'::jsonb),
('mouse', 'en', 'technology', 1, 'common', '{
    "es": "ratón",
    "fr": "souris",
    "de": "Maus",
    "it": "mouse",
    "pt": "mouse",
    "ja": "マウス",
    "ko": "마우스",
    "zh": "鼠标"
}'::jsonb),
('monitor', 'en', 'technology', 2, 'common', '{
    "es": "monitor",
    "fr": "moniteur",
    "de": "Monitor",
    "it": "monitor",
    "pt": "monitor",
    "ja": "モニター",
    "ko": "모니터",
    "zh": "显示器"
}'::jsonb),
('headphones', 'en', 'technology', 2, 'common', '{
    "es": "auriculares",
    "fr": "écouteurs",
    "de": "Kopfhörer",
    "it": "cuffie",
    "pt": "fones de ouvido",
    "ja": "ヘッドフォン",
    "ko": "헤드폰",
    "zh": "耳机"
}'::jsonb),
('camera', 'en', 'technology', 2, 'common', '{
    "es": "cámara",
    "fr": "caméra",
    "de": "Kamera",
    "it": "fotocamera",
    "pt": "câmera",
    "ja": "カメラ",
    "ko": "카메라",
    "zh": "相机"
}'::jsonb),
('microphone', 'en', 'technology', 2, 'common', '{
    "es": "micrófono",
    "fr": "microphone",
    "de": "Mikrofon",
    "it": "microfono",
    "pt": "microfone",
    "ja": "マイク",
    "ko": "마이크",
    "zh": "麦克风"
}'::jsonb)
ON CONFLICT (word, language) DO UPDATE SET
    translations = EXCLUDED.translations,
    category = EXCLUDED.category;

-- Update the language field to be consistent (should be language code, not full name)
UPDATE master_vocabulary 
SET language = 'en' 
WHERE language = 'English' OR language IS NULL;

-- Clean up
DROP TABLE vocabulary_translations_temp;